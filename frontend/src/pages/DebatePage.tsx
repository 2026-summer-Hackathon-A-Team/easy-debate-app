import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';

import Button from '../components/Button';
import TextField from '../components/TextField';
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

  // TopicConfirmationPage(debate:start)またはSocketManager(sync:result)からnavigateの
  // stateで渡ってくる値。画面リロード時・直接URLアクセス時はまだstateが無いため、
  // SocketManagerがsync:resultを受け取って改めてnavigateしてくるまで何も描画しない
  const initial = location.state as DebateStart | null;

  const [debate, setDebate] = useState<DebateState | null>(() =>
    initial && {
      topic: initial.topic,
      users: initial.users,
      turn: initial.turn,
      chatHistory: initial.chatHistory,
    },
  );
  const [chatSubmitDeadline, setChatSubmitDeadline] = useState(
    () => initial?.chatSubmitDeadline ?? new Date(0).toISOString(),
  );
  // 発言期限までの残り秒数
  const remainingSeconds = useCountdownTimer(chatSubmitDeadline);
  const [chatInput, setChatInput] = useState('');
  // 送信済みで相手からの応答待ちか
  const [isSending, setIsSending] = useState(false);

  // judgeDisplayStartAtを含むjudge:resultを受け取った後、遷移待ちの間だけ入る値
  const [pendingJudgeResult, setPendingJudgeResult] =
    useState<JudgeResult | null>(null);
  // judgeDisplayStartAtまでの残り秒数(pendingJudgeResultが無い間は既に期限切れの日時を渡す)
  const judgeWaitRemainingSeconds = useCountdownTimer(
    pendingJudgeResult?.judgeDisplayStartAt ?? new Date(0).toISOString(),
  );

  const isMyTurn = debate?.turn.isCurrentTurnUserId === userInfo?.userId;

  // 発言期限が0になったか(debateが届くまでは常にfalse扱い)
  const isTimeUp = debate !== null && remainingSeconds <= 0;

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
      // judgeDisplayStartAtが無い場合(2連続無回答・離脱による不戦敗)は即座に遷移する。
      // ある場合は、相手の最後のチャットを確認する時間として待機してから遷移する
      // (実際の待機とnavigateはjudgeWaitRemainingSecondsを見ているuseEffectで行う)
      if (data.judgeDisplayStartAt === undefined) {
        navigate('/debates/judge', { state: data });
        return;
      }

      setPendingJudgeResult(data);
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

    // 発言期限が切れたら、入力中の内容(空でも)をそのまま自動送信する。
  // 送信結果のstate更新はdebate:chatReceive側で行うため、ここではsocket.emitのみ行う
  useEffect(() => {
    if (isMyTurn && !isSending && isTimeUp) {
      const payload: DebateChatSend = { chatMsg: chatInput.trim() };

      socket.emit('debate:chatSend', payload);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSending(true);
    }
    // isTimeUpになった瞬間にだけ発火させたいので、chatInput等は依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp]);

  // judgeDisplayStartAtまでの待機が終わったら、勝敗判定情報を渡しながら遷移する
  useEffect(() => {
    if (pendingJudgeResult && judgeWaitRemainingSeconds <= 0) {
      navigate('/debates/judge', { state: pendingJudgeResult });
    }
  }, [pendingJudgeResult, judgeWaitRemainingSeconds, navigate]);

  function handleSend() {
    const trimmed = chatInput.trim();

    if (!isMyTurn || isSending || trimmed === '') {
      return;
    }

    const payload: DebateChatSend = { chatMsg: trimmed };

    socket.emit('debate:chatSend', payload);
    setIsSending(true);
  }
  // isTimeUp中・判定結果待機中は次に進めないようにする(タイムアウト自動送信の二重送信防止)
  const isInputDisabled =
    !isMyTurn || isSending || isTimeUp || pendingJudgeResult !== null;

  // SocketManagerがsync:resultを受け取って改めてnavigateしてくるまで何も描画しない
  if (!debate) {
    return null;
  }

  const me = debate.users.find((user) => user.userId === userInfo?.userId) ??
    debate.users[0];
  const opponent = debate.users.find(
    (user) => user.userId !== userInfo?.userId,
  ) ?? debate.users[1];

  // ターン進捗ドット1つぶんの色を決める
  // (完了済みは実際に発言したユーザー、現在のターンは今の手番のユーザーの色にする)
  function turnDotColor(turnNumber: number) {
    if (turnNumber > debate!.turn.currentTurn) {
      return '#e4e2dd';
    }

    const isMine =
      turnNumber === debate!.turn.currentTurn
        ? isMyTurn
        : debate!.chatHistory[turnNumber - 1]?.userId === userInfo?.userId;

    return isMine ? '#4c7e63' : '#8a5a2e';
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-10 pb-15">
      <div className="flex flex-col md:flex-row gap-5 items-start">
        <div className="flex flex-col gap-3.5 w-full md:w-72 md:flex-shrink-0">
          <div className="bg-white border border-[#e4e2dd] rounded-2xl p-5 text-center">
            <div className="text-xs font-extrabold text-[#4c7e63]">
              お題
            </div>
            <div className="mt-2 text-base font-bold text-[#232823]">
              {debate.topic}
            </div>
          </div>

          <div className="bg-white border border-[#e4e2dd] rounded-2xl p-4.5 flex flex-col gap-2.5">
            <div className="rounded-lg px-2.5 py-2 bg-[#e7f0ea] border border-[#cfe1d6] flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#2c4d3b]">
                {me.position}
              </span>
              <span className="text-xs font-extrabold text-[#2c4d3b] bg-[#cfe1d6] rounded-full px-2 py-0.5">
                あなた
              </span>
            </div>
            <div className="px-2.5 py-2">
              <span className="text-xs font-bold text-[#8a5a2e]">
                {opponent.position}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#e4e2dd] rounded-2xl p-5 text-center">
            {pendingJudgeResult ? (
              <>
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-[#cfe1d6] border-t-[#4c7e63]" />
                <div className="mt-3 text-xs font-bold text-[#8a8f89]">
                  まもなく判定結果が表示されます…
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-[#8a8f89] mb-1.5">
                  {isMyTurn ? 'あなたのターン' : '相手のターン'}
                </div>
                <div className="text-3xl font-extrabold text-[#232823]">
                  {remainingSeconds}秒
                </div>
                <div className="mt-3.5 flex justify-center gap-1">
                  {Array.from({ length: debate.turn.totalTurn }, (_, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: turnDotColor(i + 1) }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full bg-white border border-[#e4e2dd] rounded-2xl flex flex-col h-[56vh]">
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {debate.chatHistory.map((chat, index) => {
              const isMe = chat.userId === userInfo?.userId;

              return (
                <div
                  key={index}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
            <TextField
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              disabled={isInputDisabled}
              maxLength={500}
              placeholder={
                pendingJudgeResult
                  ? '判定結果を待っています…'
                  : isMyTurn
                    ? '主張を入力（Enterで送信）'
                    : '相手のターンです…'
              }
              className="flex-1 rounded-xl border-[#e4e2dd] px-3.5 py-3 text-sm focus:border-[#4c7e63]"
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
      </div>
    </div>
  );
}

export default DebatePage;
