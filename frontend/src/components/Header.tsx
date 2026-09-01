import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtom, useStore } from 'jotai';
import { isFetchingUserInfoAtom } from '../stores/userAtom';

import logo from '../assets/easy-debate-logo.png';
import Heading from '../components/Heading';
import ApiError from '../api/apiError';
import { getUserInfo } from '../api/userApi';
import { signout } from '../api/authApi';
import { loginStatusAtom, userInfoAtom } from '../stores/userAtom';

// ログインしていなくてもアクセス可能なページ
const publicPaths = ['/signin', '/signup'];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loginStatus, setLoginStatus] = useAtom(loginStatusAtom);
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  const store = useStore();

  // 現在のパスがログインしていなくてもアクセス可能なページかどうか判定
  const isPublicPage = publicPaths.includes(location.pathname);

  // ログイン済みの場合、続けてユーザー情報を取得
  useEffect(() => {
    if (loginStatus !== 'loggedIn' || isPublicPage || userInfo !== null) {
      return;
    }

    if (store.get(isFetchingUserInfoAtom)) {
      return;
    }

    // 2重呼び出し防止
    store.set(isFetchingUserInfoAtom, true);

    async function fetchUserInfo() {
      try {
        const data = await getUserInfo();

        setUserInfo(data);
      } catch (error) {
        // 未認証の場合はログイン画面へ
        if (error instanceof ApiError && error.status === 401) {
          window.location.replace('/signin');
          return;
        }

        // それ以外のエラーは想定外のためエラー画面へ
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

  // ログアウト
  async function handleLogout() {
    try {
      await signout();
    } catch {
      // ログアウト自体は続行するため、エラーは無視
    } finally {
      setLoginStatus('loggedOut');
      setUserInfo(null);
      navigate('/signin');
    }
  }

  return (
    <header className="bg-white border-b border-[#e4e2dd]">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-y-2 px-5 py-3.5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center cursor-pointer"
        >
          <img
            className="flex w-10 h-10"
            src={logo}
            alt="easy-debate-app-logo"
          />
          <Heading level={2} className="flex ml-3">
            やさしいディベート
          </Heading>
        </button>

        {loginStatus === 'loggedIn' && (
          <div className="flex items-center gap-2.5">
            {userInfo && (
              <div className="font-medium rounded-full border border-[#cfe1d6] bg-[#e7f0ea] px-3.5 py-1.5 text-sm text-[#232823]">
                レート {userInfo.rate}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rounded-[10px] border border-[#e4e2dd] bg-white px-4 py-2 text-[13px] font-bold text-[#6f766f] cursor-pointer"
            >
              プロフィール
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-[10px] border border-[#e4e2dd] bg-white px-4 py-2 text-[13px] font-bold text-[#6f766f] cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
