import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAtom } from 'jotai';

import logo from '../assets/easy-debate-logo.png';
import Heading from '../components/Heading';
import ApiError from '../api/apiError';
import { getUserInfo } from '../api/userApi';
import { loginStatusAtom, userInfoAtom } from '../stores/userAtom';

function Header() {
  const navigate = useNavigate();

  const [loginStatus, setLoginStatus] = useAtom(loginStatusAtom);
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  // ログイン済みと分かったら、ユーザー情報を取得する(初期処理)
  useEffect(() => {
    if (loginStatus !== 'loggedIn' || userInfo !== null) {
      return;
    }

    async function fetchUserInfo() {
      try {
        const data = await getUserInfo();

        setUserInfo(data);
      } catch (error) {
        // 401(未認証)ならセッション切れとみなしログアウト状態にする
        if (error instanceof ApiError && error.status === 401) {
          setLoginStatus('loggedOut');
          setUserInfo(null);
          return;
        }

        // それ以外のエラーは想定外のためエラーページへ(ログインチェックも未確認に戻す)
        setLoginStatus('unchecked');
        navigate('/500');
      }
    }

    fetchUserInfo();
  }, [loginStatus, userInfo, setLoginStatus, setUserInfo, navigate]);

  return (
    <header className="bg-white border-b border-[#e4e2dd]">
      <div className="mx-auto h-16 flex flex-raw items-center px-5">
        <img className="flex w-10 h-10" src={logo} alt="easy-debate-app-logo" />
        <Heading level={2} className="flex ml-3">
          やさしいディベート
        </Heading>
      </div>
    </header>
  );
}

export default Header;
