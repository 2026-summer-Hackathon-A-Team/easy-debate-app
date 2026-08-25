import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtom, useStore } from 'jotai';
import { isFetchingUserInfoAtom } from '../stores/userAtom';

import logo from '../assets/easy-debate-logo.png';
import Heading from '../components/Heading';
import ApiError from '../api/apiError';
import { getUserInfo } from '../api/userApi';
import { loginStatusAtom, userInfoAtom } from '../stores/userAtom';

// ログインしていなくてもアクセスできるページ(AuthWrapperと同じ定義)
const publicPaths = ['/signin', '/signup'];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loginStatus, setLoginStatus] = useAtom(loginStatusAtom);
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  const store = useStore();

  // 現在のパスが「未ログインでも見られるページ」かどうか
  const isPublicPage = publicPaths.includes(location.pathname);

  // ログイン済みと分かったら、ユーザー情報を取得する(初期処理)
  useEffect(() => {
    if (loginStatus !== 'loggedIn' || isPublicPage || userInfo !== null) {
      return;
    }

    if (store.get(isFetchingUserInfoAtom)) {
      return;
    }

    // 先に呼び出す側としてフラグを立てる
    store.set(isFetchingUserInfoAtom, true);

    async function fetchUserInfo() {
      try {
        const data = await getUserInfo();

        setUserInfo(data);
      } catch (error) {
        // 401(未認証)ならセッションが無効なので、関連するstoreを全て初期化しつつログインチェックからやり直す
        if (error instanceof ApiError && error.status === 401) {
          window.location.replace('/signin');
          return;
        }

        // それ以外のエラーは想定外のためエラーページへ(ログインチェックも未確認に戻す)
        setLoginStatus('unchecked');
        navigate('/500');
      } finally {
        store.set(isFetchingUserInfoAtom, false);
      }
    }

    fetchUserInfo();
  }, [
    loginStatus,
    isPublicPage,
    userInfo,
    setLoginStatus,
    setUserInfo,
    navigate,
    store,
  ]);

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
