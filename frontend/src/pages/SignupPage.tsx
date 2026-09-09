import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import logo from '../assets/easy-debate-logo.png';
import CardLayout from '../Layouts/CardLayout';
import Button from '../components/Button';
import Heading from '../components/Heading';
import Modal from '../components/Modal';
import ValidatedTextField from '../components/ValidatedTextField';
import ApiError from '../api/apiError';
import { registerUser } from '../api/userApi';
import { userNameSchema, passwordSchema } from '../validation/userSchemas';

type ModalState = 'success' | 'validationError' | 'duplicateError' | null;

function SignupPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isUserNameValid = userNameSchema.safeParse(userName).success;
  const isPasswordValid = passwordSchema.safeParse(password).success;
  const canSubmit = isUserNameValid && isPasswordValid && !isSubmitting;

  /**
   * 新規登録
   */
  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({ userName, password });
      setModal('success');
    } catch (error) {
      // ユーザー名重複
      if (error instanceof ApiError && error.status === 409) {
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

  /**
   * ログイン画面へ遷移
   */
  function handleGoToSignin() {
    navigate('/signin', { state: { userName } });
  }

  return (
    <CardLayout>
      <div className="mb-7 text-center">
        <img
          className="w-12 h-12 mx-auto mb-3.5"
          src={logo}
          alt="easy-debate-app-logo"
        />
        <Heading level={1}>新規登録</Heading>
        <Heading level={3} className="mt-1">
          やさしいディベートへようこそ
        </Heading>
      </div>

      <div className="flex flex-col gap-4">
        <ValidatedTextField
          id="username"
          label="ユーザー名"
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

        <ValidatedTextField
          id="password"
          label="パスワード"
          type="password"
          wrapperClassName="mt-1"
          placeholder="8~64文字（英数字混合）"
          maxLength={64}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errorMessage={
            password !== '' && !isPasswordValid
              ? 'パスワードは8〜64文字の英数字混合で入力してください'
              : undefined
          }
        />

        <Button className="mt-2" disabled={!canSubmit} onClick={handleSubmit}>
          新規登録
        </Button>
        <Heading level={3} className="text-center mt-2 mb-1">
          すでにアカウントをお持ちの方は
          <Link to="/signin" className="font-black">
            ログイン
          </Link>
        </Heading>
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
          <p className="text-[36px] mb-3">🎉</p>
          <Heading level={2}>登録が完了しました</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            ログインして始めましょう
          </p>
          <Button className="mt-5 w-full" onClick={handleGoToSignin}>
            ログインへ
          </Button>
        </Modal>
      )}
    </CardLayout>
  );
}

export default SignupPage;
