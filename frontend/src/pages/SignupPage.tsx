import logo from '../assets/easy-debate-logo.png';
import { Link } from 'react-router';
import CardLayout from '../Layouts/CardLayout';
import Button from '../components/Button';

function SignupPage() {
  return (
    <CardLayout>
      <div className="mb-7 text-center">
        <img
          className="w-12 h-12 mx-auto mb-3.5"
          src={logo}
          alt="easy-debate-app-logo"
        />
        <h1>新規登録</h1>
        <h3>やさしいディベートへようこそ</h3>
      </div>

      <div className="flex flex-col gap-4">
        <label htmlFor="username" className="flex flex-col gap-1.5">
          <p className="text-[13px] font-bold gap-4">ユーザー名</p>
          <input
            id="username"
            type="text"
            placeholder="6~20文字（英数字）"
          ></input>
        </label>

        <label htmlFor="password" className="flex flex-col gap-1.5">
          <p className="text-[13px] font-bold gap-4">パスワード</p>
          <input placeholder="8~64文字（英数字混合）"></input>
        </label>

        <Button>新規登録</Button>
        <h3 className="text-center">
          すでにアカウントをお持ちの方は<Link to="/signin">ログイン</Link>
        </h3>
      </div>
    </CardLayout>
  );
}

export default SignupPage;
