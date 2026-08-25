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

  // 成功でも失敗でもログインステータス・ユーザー情報を初期化してログイン画面へ戻す
  async function handleLogout() {
    try {
      await signout();
    } catch {
      // ログアウト自体は続行するので、ここでのエラーは無視する
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
