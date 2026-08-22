import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useAtom } from 'jotai';

import { checkSession } from '../api/authApi';
import ApiError from '../api/apiError';
import { getUserInfo } from '../api/userApi';
import { loginStatusAtom, userInfoAtom } from '../stores/userAtom';

// ログインしていなくてもアクセスできるページ
const publicPaths = ['/signin', '/signup'];

function AuthWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  // ログイン状態: 'unchecked'(未確認) | 'loggedIn' | 'loggedOut'
  const [loginStatus, setLoginStatus] = useAtom(loginStatusAtom);

  // ログインユーザーの情報(未取得の間は null)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  // 現在のパスが「未ログインでも見られるページ」かどうか
  const isPublicPage = publicPaths.includes(location.pathname);

  // 1. マウント時に一度だけセッションの有無をサーバーに確認しloginStatusを確定させる
  useEffect(() => {
    if (loginStatus !== 'unchecked') {
      return;
    }

    async function fetchLoginStatus() {
      try {
        const status = await checkSession();

        setLoginStatus(status);
      } catch {
        // セッション確認自体に失敗した場合は想定外のためエラーページへ
        navigate('/500');
      }
    }

    fetchLoginStatus();
  }, [loginStatus, setLoginStatus, navigate]);

  // 2. ログイン済みと分かったら、続けてユーザー情報を取得する
  useEffect(() => {
    if (loginStatus !== 'loggedIn' || isPublicPage || userInfo !== null) {
      return;
    }

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
      }
    }

    fetchUserInfo();
  }, [loginStatus, userInfo, setLoginStatus, setUserInfo, navigate]);

  // ログイン状態がまだ確認できていない間は何も描画しない(画面のちらつき防止)
  if (loginStatus === 'unchecked') {
    return null;
  }

  // ログイン済みなのにサインイン/サインアップ等のページにいる場合はホームへ
  if (loginStatus === 'loggedIn' && isPublicPage) {
    return <Navigate to="/" replace />;
  }

  // 未ログインなのに保護されたページにいる場合はサインインへ
  if (loginStatus === 'loggedOut' && !isPublicPage) {
    return <Navigate to="/signin" replace />;
  }

  // ログイン済みだがユーザー情報の取得がまだ終わっていない間は何も描画しない
  if (loginStatus === 'loggedIn' && userInfo === null) {
    return null;
  }

  // 認証チェックを通過したら、実際のページを描画する
  return <Outlet />;
}

export default AuthWrapper;
