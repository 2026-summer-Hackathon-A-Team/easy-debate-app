import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAtom } from 'jotai';

import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ValidatedTextField from '../components/ValidatedTextField';
import ApiError from '../api/apiError';
import { updateUserName } from '../api/userApi';
import { userInfoAtom } from '../stores/userAtom';
import { userNameSchema } from '../validation/userSchemas';

type ModalState =
  | 'success'
  | 'validationError'
  | 'duplicateError'
  | 'unauthorizedError'
  | null;

function NameChangePage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  // 初期値として現在のユーザー名を入れる
  const [userName, setUserName] = useState(userInfo?.userName ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const trimmed = userName.trim();
  const isUserNameValid = userNameSchema.safeParse(trimmed).success;
  const isUnchanged = trimmed === '' || trimmed === userInfo?.userName;
  const canSubmit = isUserNameValid && !isUnchanged && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await updateUserName({ userName: trimmed });

      setUserInfo((prev) =>
        prev ? { ...prev, userName: data.userName } : prev,
      );
      setModal('success');
    } catch (error) {

      if (error instanceof ApiError && error.status === 401) {
        setModal('unauthorizedError');
      }
      // ユーザー名重複
      else if (error instanceof ApiError && error.status === 409) {
        setErrorMessage(error.message);
        setModal('duplicateError');
      }
      // バリデーションNG
      else if (error instanceof ApiError && error.status === 400) {
        setErrorMessage(error.message);
        setModal('validationError');
      } else {
        navigate('/500');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 pb-10 -mt-6">
      <div className="w-full max-w-[420px] rounded-[20px] border border-[#e4e2dd] bg-white px-8 py-9">
        <div className="mb-6">
          <Heading level={1} className="text-[20px]">
            ユーザー名変更
          </Heading>
          <p className="mt-1 text-[13px] text-[#8a8f89]">
            現在：{userInfo?.userName}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <ValidatedTextField
            id="new-username"
            label="新しいユーザー名"
            type="text"
            placeholder="6~20文字（英数字）"
            maxLength={20}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            errorMessage={
              userName !== '' && !isUserNameValid
                ? 'ユーザー名は6〜20文字の英数字で入力してください'
                : undefined
            }
          />

          <div className="flex gap-2.5 mt-2">
            <Button
              className="flex-1 border border-[#e4e2dd] bg-white font-body text-[#6f766f] hover:bg-white"
              onClick={() => navigate('/profile')}
            >
              戻る
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              変更する
            </Button>
          </div>
        </div>
      </div>

      {modal === 'validationError' && (
        <Modal>
          <Heading level={2}>入力内容に誤りがあります</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            {errorMessage}
          </p>
          <Button className="mt-5 w-full" onClick={() => setModal(null)}>
            OK
          </Button>
        </Modal>
      )}

      {modal === 'duplicateError' && (
        <Modal>
          <Heading level={2}>そのユーザー名は使用済みです</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            {errorMessage}
          </p>
          <Button className="mt-5 w-full" onClick={() => setModal(null)}>
            閉じる
          </Button>
        </Modal>
      )}

      {modal === 'success' && (
        <Modal>
          <p className="text-[36px] mb-3">✅</p>
          <Heading level={2}>ユーザー名を変更しました</Heading>
          <Button className="mt-5 w-full" onClick={() => navigate('/profile')}>
            プロフィールへ戻る
          </Button>
        </Modal>
      )}

      {modal === 'unauthorizedError' && (
        <Modal>
          <Heading level={2}>ユーザー名の変更に失敗しました</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            再度、ログインしてください
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

export default NameChangePage;
