import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useAtom, useStore } from 'jotai';

import { checkSession } from '../api/authApi';
import ApiError from '../api/apiError';
import { getUserInfo } from '../api/userApi';
import {
  isCheckingSessionAtom,
  isFetchingUserInfoAtom,
  loginStatusAtom,
  userInfoAtom,
} from '../stores/userAtom';

// ログインしていなくてもアクセスできるページ
const publicPaths = ['/signin', '/signup'];

function AuthWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  // ログイン状態: 'unchecked'(未確認) | 'loggedIn' | 'loggedOut'
  const [loginStatus, setLoginStatus] = useAtom(loginStatusAtom);

  // ログインユーザーの情報(未取得の間は null)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  const store = useStore();

  // 現在のパスが「未ログインでも見られるページ」かどうか
  const isPublicPage = publicPaths.includes(location.pathname);

  // 1. マウント時に一度だけセッションの有無をサーバーに確認し、loginStatus を確定させる
  useEffect(() => {
    if (loginStatus !== 'unchecked') {
      return;
    }

    // 既に誰かが呼び出し中なら、後から来たこちらは呼び出さない
    if (store.get(isCheckingSessionAtom)) {
      return;
    }

    // 先に呼び出す側としてフラグを立てる
    store.set(isCheckingSessionAtom, true);

    async function fetchLoginStatus() {
      try {
        const status = await checkSession();

        setLoginStatus(status);
      } catch {
        // TODO: API実装後はこちらを使う(セッション確認自体に失敗した場合はエラーページへ)
        // navigate('/500');

        // API未実装のため checkSession が必ず失敗する。
        // /500 に飛ばされ続けて開発が進まないため、一旦ここでログイン済み・未ログインの扱いにしている。
        // API実装後は削除し、上の navigate('/500') に戻す。
        setLoginStatus('loggedIn');
      } finally {
        store.set(isCheckingSessionAtom, false);
      }
    }

    fetchLoginStatus();
  }, [loginStatus, setLoginStatus, navigate, store]);

  // 2. ログイン済みと分かったら、続けてユーザー情報を取得する
  useEffect(() => {
    if (loginStatus !== 'loggedIn' || isPublicPage || userInfo !== null) {
      return;
    }

    // 既に誰かが呼び出し中なら、後から来たこちらは呼び出さない
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
        // 401(未認証)ならセッション切れとみなしログアウト状態にする
        if (error instanceof ApiError && error.status === 401) {
          setLoginStatus('loggedOut');
          setUserInfo(null);
          return;
        }

        // TODO: API実装後はこちらを使う(それ以外のエラーは想定外のためエラーページへ,ログインチェックも未確認に変更)
        // setLoginStatus('unchecked')
        // navigate('/500');

        // API未実装のため getUserInfo が必ず失敗する。
        // /500 に飛ばされ続けて開発が進まないため、一旦ダミーのユーザー情報をセットしている。
        // API実装後は削除し、上の navigate('/500') に戻す。
        setUserInfo({ userId: 0, userName: 'dummy', rate: 1500 });
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
