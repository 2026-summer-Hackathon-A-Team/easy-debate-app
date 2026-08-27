import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';

import Button from '../components/Button';
import TextField from '../components/TextField';
import { socket } from '../socket/socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import { userInfoAtom } from '../stores/userAtom';
import type { DebateStart } from '../types/socket/debateStart';
import type { DebateChatSend } from '../types/socket/debateChatSend';
import type { DebateChatReceive } from '../types/socket/debateChatReceive';
import type { JudgeResult } from '../types/socket/judgeResult';

type DebateState = DebateStart;

function DebatePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const userInfo = useAtomValue(userInfoAtom);

  const [debate, setDebate] = useState(location.state as DebateState);
  // 発言期限までの残り秒数(debateが届くまでは既に期限切れの日時を渡してタイマーを動かさない)
  const remainingSeconds = useCountdownTimer(
    debate?.chatSubmitDeadline ?? new Date(0).toISOString(),
  );
  const [chatInput, setChatInput] = useState('');
  // 送信済みで相手からの応答待ちか
  const [isSending, setIsSending] = useState(false);

  // ターン全て終了しているか
  const [isDebateFinished, setIsDebateFinished] = useState(
    debate !== null && debate?.turn.totalTurn + 1 <= debate?.turn.currentTurn,
  );

  const isMyTurn = debate?.turn.isCurrentTurnUserId === userInfo?.userId;

  // 発言期限が0になったか(debateが届くまでは常にfalse扱い)
  const isTimeUp = debate !== null && remainingSeconds <= 0;

  // チャットの応答と勝敗判定結果を監視する
  useEffect(() => {
    function handleChatReceive(data: DebateChatReceive) {
      setDebate(data);
      setIsDebateFinished(
        data !== null && data.turn.totalTurn + 1 <= data.turn.currentTurn,
      );
      setChatInput('');
      setIsSending(false);
    }

    // 判定結果がjudge:resultで返却されたら、3秒後にJudgeResultPageに遷移する
    // （ユーザーに最後のチャットを読んでもらう猶予を与えるため）
    let timer: number;

    function handleJudgeResult(data: JudgeResult) {
      timer = window.setTimeout(() => {
        navigate('/debates/judge', { state: data });
      }, 3000);
    }

    socket.on('debate:chatReceive', handleChatReceive);
    socket.on('judge:result', handleJudgeResult);

    return () => {
      clearTimeout(timer);
      socket.off('debate:chatReceive', handleChatReceive);
      socket.off('judge:result', handleJudgeResult);
    };
    // navigateは依存に含めない(socketManager.tsxと同じ理由: pathnameが変わるたびに
    // 参照が作り直され、このeffectが不要に再実行されてしまうため)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 発言期限が切れたら、入力中の内容(空でも)をそのまま自動送信する。
  // 送信結果のstate更新はdebate:chatReceive側で行うため、ここではsocket.emitのみ行う。
  // 全ターン終了後(JUDGE_WAITING)は発言期限自体が存在せず、debateにchatSubmitDeadlineが
  // 含まれないため常に期限切れ扱いになる。この状態で送るとサーバー側で弾かれるので除外する
  useEffect(() => {
    if (isMyTurn && !isSending && isTimeUp && !isDebateFinished) {
      const payload: DebateChatSend = { chatMsg: chatInput.trim() };

      socket.emit('debate:chatSend', payload);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSending(true);
    }
    // isTimeUpになった瞬間にだけ発火させたいので、chatInput等は依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp]);

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
    !isMyTurn || isSending || isTimeUp || isDebateFinished;

  // SocketManagerがsync:resultを受け取って改めてnavigateしてくるまで何も描画しない
  if (!debate) {
    return null;
  }

  const me =
    debate.users.find((user) => user.userId === userInfo?.userId) ??
    debate.users[0];
  const opponent =
    debate.users.find((user) => user.userId !== userInfo?.userId) ??
    debate.users[1];

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
            <div className="text-xs font-extrabold text-[#4c7e63]">お題</div>
            <div className="mt-2 text-base font-bold text-[#232823]">
              {debate.topic}
            </div>
          </div>

          <div className="bg-white border border-[#e4e2dd] rounded-2xl p-4.5 flex flex-col gap-2.5">
            <div
              className={`rounded-lg px-2.5 py-2 ${isMyTurn ? 'bg-[#e7f0ea] border border-[#cfe1d6]' : ''}  flex items-center gap-1.5`}
            >
              <span
                className={`text-xs font-bold ${isMyTurn ? 'text-[#2c4d3b]' : ''} `}
              >
                {me.position}
              </span>
              {isMyTurn && (
                <span className="text-xs font-extrabold text-[#2c4d3b] bg-[#cfe1d6] rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                  あなた
                </span>
              )}
            </div>

            <div
              className={`rounded-lg px-2.5 py-2 ${!isMyTurn ? 'bg-[#f7ede3] border border-[#ecd8bf]' : ''} flex items-center gap-1.5`}
            >
              <span
                className={`text-xs font-bold ${!isMyTurn ? 'text-[#8a5a2e]' : ''}`}
              >
                {opponent.position}
              </span>
              {!isMyTurn && (
                <span className="text-xs font-extrabold text-[#8a5a2e] bg-[#ecd8bf] rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                  相手
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e4e2dd] rounded-2xl p-5 text-center">
            {isDebateFinished ? (
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
                isDebateFinished
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
