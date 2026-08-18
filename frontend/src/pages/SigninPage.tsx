import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';

import logo from '../assets/easy-debate-logo.png';
import CardLayout from '../Layouts/CardLayout';
import Button from '../components/Button';
import Heading from '../components/Heading';
import Modal from '../components/Modal';
import ValidatedTextField from '../components/ValidatedTextField';
import ApiError from '../api/apiError';
import { signin } from '../api/authApi';
import { getUserInfo } from '../api/userApi';
import { loginStatusAtom, userInfoAtom } from '../stores/userAtom';
import { userNameSchema, passwordSchema } from '../validation/userSchemas';

type ModalState = 'credentialsError' | 'loginError' | null;

function SigninPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setLoginStatus = useSetAtom(loginStatusAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  // SignupPage(登録完了後の「ログインへ」)からnavigateのstateで渡ってくる、入力済みのユーザー名
  const prefillUserName =
    (location.state as { userName?: string } | null)?.userName ?? '';

  const [userName, setUserName] = useState(prefillUserName);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isUserNameValid = userNameSchema.safeParse(userName).success;
  const isPasswordValid = passwordSchema.safeParse(password).success;
  const canSubmit = isUserNameValid && isPasswordValid && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signin({ userName, password });
      const loggedInUser = await getUserInfo();

      setLoginStatus('loggedIn');
      setUserInfo(loggedInUser);
      navigate('/');
    } catch (error) {
      // ユーザー名またはパスワードが不正
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage(error.message);
        setModal('credentialsError');
      }
      // それ以外(入力値NG・想定外のエラー)
      else {
        setErrorMessage(
          error instanceof ApiError ? error.message : 'ログインに失敗しました',
        );
        setModal('loginError');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CardLayout>
      <div className="mb-7 text-center">
        <img
          className="w-12 h-12 mx-auto mb-3.5"
          src={logo}
          alt="easy-debate-app-logo"
        />
        <Heading level={1}>ログイン</Heading>
        <Heading level={3} className="mt-1">
          ディベートしましょう
        </Heading>
      </div>

      <div className="flex flex-col gap-4">
        <ValidatedTextField
          id="username"
          label="ユーザー名"
          type="text"
          placeholder="ユーザー名を入力"
          minLength={6}
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
          placeholder="パスワードを入力"
          minLength={8}
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
          ログイン
        </Button>
        <Heading level={3} className="text-center mt-2 mb-1">
          アカウントをお持ちでない方は
          <Link to="/signup" className="font-black">
            新規登録
          </Link>
        </Heading>
      </div>

      {modal === 'credentialsError' && (
        <Modal>
          <p className="text-[36px] mb-3">😕</p>
          <Heading level={2}>ログインできませんでした</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            ユーザー名とパスワードを確認してください
          </p>
          <Button className="mt-5 w-full" onClick={() => setModal(null)}>
            閉じる
          </Button>
        </Modal>
      )}

      {modal === 'loginError' && (
        <Modal>
          <Heading level={2}>ログインに失敗しました</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            {errorMessage}
          </p>
          <Button className="mt-5 w-full" onClick={() => setModal(null)}>
            閉じる
          </Button>
        </Modal>
      )}
    </CardLayout>
  );
}

export default SigninPage;
