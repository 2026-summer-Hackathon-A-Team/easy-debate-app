import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';

import CardLayout from '../Layouts/CardLayout';
import Heading from '../components/Heading';
import Button from '../components/Button';
import { socket } from '../socket/socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import { userInfoAtom } from '../stores/userAtom';
import type { ChatHistoryItem, JoinUser, TurnInfo } from '../types/sync/common';
import type { DebateStart } from '../types/socket/debateStart';
import type { DebateChatSend } from '../types/socket/debateChatSend';
import type { DebateChatReceive } from '../types/socket/debateChatReceive';
import type { JudgeResult } from '../types/socket/judgeResult';

type DebateState = {
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatHistory: ChatHistoryItem[];
};

function DebatePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const userInfo = useAtomValue(userInfoAtom);

  // TopicConfirmationPage(debate:start)からnavigateのstateで渡ってくる値。
  // 画面リロード時もこの導線を通るため、直接URLアクセス（stateが無い場合）は不正アクセスとして扱う
  const initial = location.state as DebateStart;

  const [debate, setDebate] = useState<DebateState>({
    topic: initial.topic,
    users: initial.users,
    turn: initial.turn,
    chatHistory: initial.chatHistory,
  });
  const [chatSubmitDeadline, setChatSubmitDeadline] = useState(
    initial.chatSubmitDeadline,
  );
  // 発言期限までの残り秒数
  const remainingSeconds = useCountdownTimer(chatSubmitDeadline);
  const [chatInput, setChatInput] = useState('');
  // 送信済みで相手からの応答待ちか
  const [isSending, setIsSending] = useState(false);

  const me = debate.users.find((user) => user.userId === userInfo?.userId) ??
    debate.users[0];
  const opponent = debate.users.find(
    (user) => user.userId !== userInfo?.userId,
  ) ?? debate.users[1];

  const isMyTurn = debate.turn.isCurrentTurnUserId === userInfo?.userId;
  const turnsLeft = debate.turn.totalTurn - debate.turn.currentTurn + 1;

  // 発言期限が0になったか
  const isTimeUp = remainingSeconds <= 0;

  // チャットの応答と勝敗判定結果を監視する
  useEffect(() => {
    function handleChatReceive(data: DebateChatReceive) {
      setDebate({
        topic: data.topic,
        users: data.users,
        turn: data.turn,
        chatHistory: data.chatHistory,
      });
      setChatSubmitDeadline(data.chatSubmitDeadline);
      setChatInput('');
      setIsSending(false);
    }

    function handleJudgeResult(data: JudgeResult) {
      navigate('/debates/judge', { state: data });
    }

    socket.on('debate:chatReceive', handleChatReceive);
    socket.on('judge:result', handleJudgeResult);

    return () => {
      socket.off('debate:chatReceive', handleChatReceive);
      socket.off('judge:result', handleJudgeResult);
    };
    // navigateは依存に含めない(socketManager.tsxと同じ理由: pathnameが変わるたびに
    // 参照が作り直され、このeffectが不要に再実行されてしまうため)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSend() {
    const trimmed = chatInput.trim();

    if (!isMyTurn || isSending || trimmed === '') {
      return;
    }

    const payload: DebateChatSend = { chatMsg: trimmed };

    socket.emit('debate:chatSend', payload);
    setIsSending(true);
  }

  // 発言期限が切れたら、入力中の内容(空でも)をそのまま自動送信する。
  // 送信結果のstate更新はdebate:chatReceive側で行うため、ここではsocket.emitのみ行う
  useEffect(() => {
    if (isMyTurn && !isSending && isTimeUp) {
      const payload: DebateChatSend = { chatMsg: chatInput.trim() };

      socket.emit('debate:chatSend', payload);
    }
    // isTimeUpになった瞬間にだけ発火させたいので、chatInput等は依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp]);

  // isTimeUp中は次の応答が来るまで入力できないようにする(タイムアウト自動送信の二重送信防止)
  const isInputDisabled = !isMyTurn || isSending || isTimeUp;

  return (
    <CardLayout>
      <div className="flex flex-col items-center">
        <Heading level={3} className="font-body font-bold text-[#4c7e63]">
          ディベート
        </Heading>
        <div className="grid grid-cols-2 justify-items-center items-center mt-3 rounded-3xl bg-[#e8f0eb] p-3">
          <div className="text-xs text-[#2c4d3b] font-body font-bold">
            発言期限
          </div>
          <div className="text-sm text-[#2c4d3b] font-body font-extrabold">
            {remainingSeconds}秒
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e4e2dd] bg-[#f7f6f3] px-4 py-3 flex items-baseline gap-2">
        <span className="text-xs font-bold text-[#4c7e63] flex-none">
          お題
        </span>
        <span className="font-heading font-bold text-sm leading-snug">
          {debate.topic}
        </span>
      </div>

      <div className="mt-2.5 flex gap-2">
        <div
          className={`flex-1 rounded-xl px-3 py-2.5 flex justify-between items-center border ${
            isMyTurn
              ? 'bg-[#e7f0ea] border-[#cfe1d6]'
              : 'bg-white border-transparent'
          }`}
        >
          <span className="text-xs font-bold text-[#2c4d3b]">
            {me.position}
          </span>
          <span
            className={`text-xs font-extrabold text-[#2c4d3b] bg-[#d6e6dc] rounded-full px-2 py-0.5 ${
              isMyTurn ? 'visible' : 'invisible'
            }`}
          >
            あなた
          </span>
        </div>
        <div
          className={`flex-1 rounded-xl px-3 py-2.5 flex justify-between items-center border ${
            !isMyTurn
              ? 'bg-[#f7ede3] border-[#ecd8bf]'
              : 'bg-white border-transparent'
          }`}
        >
          <span className="text-xs font-bold text-[#8a5a2e]">
            {opponent.position}
          </span>
          <span
            className={`text-xs font-extrabold text-[#8a5a2e] bg-[#f0ddc6] rounded-full px-2 py-0.5 ${
              !isMyTurn ? 'visible' : 'invisible'
            }`}
          >
            相手
          </span>
        </div>
      </div>

      <div className="mt-1.5 text-center text-xs text-[#8a8f89]">
        残り{turnsLeft}ターン
      </div>

      <div className="mt-3 rounded-2xl border border-[#e4e2dd] flex flex-col h-[56vh]">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {debate.chatHistory.map((chat, index) => {
            const isMe = chat.userId === userInfo?.userId;

            return (
              <div
                key={index}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#4c7e63] text-white'
                      : 'bg-[#f2f1ee] text-[#232823]'
                  }`}
                >
                  {chat.chatMsg}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[#e4e2dd] p-3.5 flex gap-2.5">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            disabled={isInputDisabled}
            placeholder={
              isMyTurn ? '主張を入力（Enterで送信）' : '相手のターンです…'
            }
            className="flex-1 rounded-xl border border-[#e4e2dd] px-3.5 py-3 text-sm outline-none focus:border-[#4c7e63]"
          />
          <Button
            className="py-0 px-5"
            disabled={isInputDisabled || chatInput.trim() === ''}
            onClick={handleSend}
          >
            送信
          </Button>
        </div>
      </div>
    </CardLayout>
  );
}

export default DebatePage;
