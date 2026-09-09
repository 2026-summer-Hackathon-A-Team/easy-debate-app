import { useState } from 'react';
import { useNavigate } from 'react-router';

import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ValidatedTextField from '../components/ValidatedTextField';
import ApiError from '../api/apiError';
import { updatePassword } from '../api/userApi';
import { passwordSchema } from '../validation/userSchemas';

type ModalState =
  | 'success'
  | 'newPasswordInvalidError'
  | 'incorrectPasswordError'
  | 'unauthorizedError'
  | null;

function PasswordChangePage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isCurrentPasswordValid =
    passwordSchema.safeParse(currentPassword).success;
  const isNewPasswordValid = passwordSchema.safeParse(newPassword).success;
  const isMismatch =
    newPasswordConfirm !== '' && newPassword !== newPasswordConfirm;
  const canSubmit =
    isCurrentPasswordValid &&
    isNewPasswordValid &&
    !isMismatch &&
    !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword({ currentPassword, newPassword });
      setModal('success');
    } catch (error) {
      // 現在のパスワードが誤り
      if (error instanceof ApiError && error.status === 422) {
        setErrorMessage(error.message);
        setModal('incorrectPasswordError');
      }
      // 新しいパスワードがバリデーションNG
      else if (error instanceof ApiError && error.status === 400) {
        setErrorMessage(error.message);
        setModal('newPasswordInvalidError');
      } else if (error instanceof ApiError && error.status === 401) {
        setModal('unauthorizedError');
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
            パスワード変更
          </Heading>
        </div>

        <div className="flex flex-col gap-4">
          <ValidatedTextField
            id="current-password"
            label="現在のパスワード"
            type="password"
            placeholder="8~64文字（英数字混合）"
            maxLength={64}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            errorMessage={
              currentPassword !== '' && !isCurrentPasswordValid
                ? 'パスワードは8〜64文字の英数字混合で入力してください'
                : undefined
            }
          />

          <ValidatedTextField
            id="new-password"
            label="新しいパスワード"
            type="password"
            wrapperClassName="mt-1"
            placeholder="8~64文字（英数字混合）"
            maxLength={64}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            errorMessage={
              newPassword !== '' && !isNewPasswordValid
                ? 'パスワードは8〜64文字の英数字混合で入力してください'
                : undefined
            }
          />

          <ValidatedTextField
            id="new-password-confirm"
            label="新しいパスワード（確認用）"
            type="password"
            wrapperClassName="mt-1"
            placeholder="もう一度入力"
            maxLength={64}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            errorMessage={isMismatch ? 'パスワードが一致しません' : undefined}
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

      {modal === 'newPasswordInvalidError' && (
        <Modal>
          <Heading level={2}>新しいパスワードが不適切です</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            {errorMessage}
          </p>
          <Button className="mt-5 w-full" onClick={() => setModal(null)}>
            OK
          </Button>
        </Modal>
      )}

      {modal === 'incorrectPasswordError' && (
        <Modal>
          <Heading level={2}>現在のパスワードが正しくありません</Heading>
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
          <Heading level={2}>パスワードを変更しました</Heading>
          <Button className="mt-5 w-full" onClick={() => navigate('/profile')}>
            プロフィールへ戻る
          </Button>
        </Modal>
      )}

      {modal === 'unauthorizedError' && (
        <Modal>
          <Heading level={2}>パスワードの変更に失敗しました</Heading>
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

export default PasswordChangePage;
