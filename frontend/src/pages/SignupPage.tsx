import logo from '../assets/easy-debate-logo.png';
import { Link } from 'react-router';
import CardLayout from '../Layouts/CardLayout';
import Button from '../components/Button';
import Heading from '../components/Heading';
import TextField from '../components/TextField';

function SignupPage() {
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
        <label htmlFor="username" className="flex flex-col gap-1.5">
          <p className="text-[13px] font-bold gap-4">ユーザー名</p>
          <TextField
            id="username"
            type="text"
            placeholder="6~20文字（英数字）"
            minLength={6}
            maxLength={20}
          />
        </label>

        <label htmlFor="password" className="flex flex-col gap-1.5 mt-1">
          <p className="text-[13px] font-bold gap-4">パスワード</p>
          <TextField
            id="password"
            type="password"
            placeholder="8~64文字（英数字混合）"
            minLength={8}
            maxLength={64}
          />
        </label>

        <Button className="mt-2">新規登録</Button>
        <Heading level={3} className="text-center mt-2 mb-1">
          すでにアカウントをお持ちの方は
          <Link to="/signin" className="font-black">
            ログイン
          </Link>
        </Heading>
      </div>
    </CardLayout>
  );
}

export default SignupPage;
