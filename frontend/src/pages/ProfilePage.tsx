import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';

import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { cancelMembership } from '../api/userApi';
import { userInfoAtom } from '../stores/userAtom';

function ProfilePage() {
  const navigate = useNavigate();
  const userInfo = useAtomValue(userInfoAtom);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWithdrawErrorModal, setShowWithdrawErrorModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  async function handleWithdraw() {
    setIsWithdrawing(true);

    try {
      await cancelMembership();
      // storeを初期化したいので、window.location.replaceを使う
      window.location.replace('/signin');
    } catch {
      // 失敗モーダルを挟んでからログイン画面へ遷移する
      setShowWithdrawModal(false);
      setShowWithdrawErrorModal(true);
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 pb-10 -mt-6">
      <div className="flex w-full max-w-[420px] flex-col gap-5">
        <div className="rounded-[22px] border border-[#e4e2dd] bg-white px-7 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f0ea] text-[22px] font-extrabold text-[#3f6a52]">
            {userInfo?.userName.slice(0, 1)}
          </div>
          <Heading level={1} className="mt-3.5 text-[19px] text-[#232823]">
            {userInfo?.userName}
          </Heading>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#cfe1d6] bg-[#e7f0ea] px-3.5 py-1.5">
            <span className="text-[12.5px] font-bold text-[#3f6a52]">
              レート
            </span>
            <span className="text-sm font-extrabold text-[#2c4d3b]">
              {userInfo?.rate}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e4e2dd] bg-white">
          <button
            type="button"
            onClick={() => navigate('/profile/username')}
            className="flex w-full items-center justify-between border-b border-[#eeece7] px-5 py-4 text-left font-body text-[13.5px] font-bold text-[#4a504a] cursor-pointer hover:bg-[#f7f6f3]"
          >
            ユーザー名変更
            <span className="text-[#c9c6bf]">›</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile/password')}
            className="flex w-full items-center justify-between px-5 py-4 text-left font-body text-[13.5px] font-bold text-[#4a504a] cursor-pointer hover:bg-[#f7f6f3]"
          >
            パスワード変更
            <span className="text-[#c9c6bf]">›</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e4e2dd] bg-white">
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="flex w-full items-center justify-between px-5 py-4 text-left font-body text-[13.5px] font-bold text-[#a6572f] cursor-pointer hover:bg-[#fdf1ec]"
          >
            退会する
            <span className="text-[#e0b39e]">›</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-center font-body text-[13.5px] font-bold text-[#8a8f89] cursor-pointer"
        >
          ← ホームへ戻る
        </button>
      </div>

      {showWithdrawModal && (
        <Modal>
          <Heading level={2}>本当に退会しますか？</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            退会するとアカウント情報は完全に削除され、
            <br />
            元に戻すことはできません。
          </p>
          <div className="flex gap-2.5 mt-5">
            <Button
              className="flex-1 border border-[#e4e2dd] bg-white font-body text-[#6f766f] hover:bg-white"
              disabled={isWithdrawing}
              onClick={() => setShowWithdrawModal(false)}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1 bg-[#b8543f] hover:bg-[#a1462f]"
              disabled={isWithdrawing}
              onClick={handleWithdraw}
            >
              退会する
            </Button>
          </div>
        </Modal>
      )}

      {showWithdrawErrorModal && (
        <Modal>
          <Heading level={2}>退会に失敗しました</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            再度お試しください。
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => window.location.replace('/signin')}
          >
            OK
          </Button>
        </Modal>
      )}
    </div>
  );
}

export default ProfilePage;
