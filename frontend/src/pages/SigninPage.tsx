import logo from '../assets/easy-debate-logo.png';
import { Link } from 'react-router';
import CardLayout from '../Layouts/CardLayout';
import Button from '../components/Button';


function SigninPage() {
  return (
      <CardLayout>
        <div className="mb-7 text-center">
          <img
            className="w-12 h-12 mx-auto mb-3.5"
            src={logo}
            alt="easy-debate-app-logo"
          />
          <h1>ログイン</h1>
          <h3 className='mt-1'>ディベートしましょう</h3>
        </div>

        <div className="flex flex-col gap-4">
          <label htmlFor="username" className="flex flex-col gap-1.5">
            <p className="text-[13px] font-bold gap-4">ユーザー名</p>
            <input
              id="username"
              type="text"
              placeholder="ユーザー名を入力"
              className='mt-1'
            ></input>
          </label>

          <label htmlFor="password" className="flex flex-col gap-1.5 mt-1">
            <p className="text-[13px] font-bold gap-4">パスワード</p>
            <input 
              id="password"
              type="text"
              placeholder="パスワードを入力"></input>
          </label>

          <Button className='mt-2'>ログイン</Button>
          <h3 className="text-center mt-2 mb-1">
            アカウントをお持ちでない方は
            <Link to="/signup">新規登録</Link>
          </h3>
        </div>
      </CardLayout>
  );
}

export default SigninPage;
