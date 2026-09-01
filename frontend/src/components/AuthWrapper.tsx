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

// ログインしていなくてもアクセス可能なページ
const publicPaths = ['/signin', '/signup'];

function AuthWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  // 現在のログイン状況
  const [loginStatus, setLoginStatus] = useAtom(loginStatusAtom);

  // ユーザー情報
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);

  const store = useStore();

  // 現在のパスがログインしていなくてもアクセス可能なページかどうか判定
  const isPublicPage = publicPaths.includes(location.pathname);

  // 初期表示時に一度だけログイン状況をサーバーに確認
  useEffect(() => {
    if (loginStatus !== 'unchecked') {
      return;
    }

    // 2重呼び出し防止
    if (store.get(isCheckingSessionAtom)) {
      return;
    }
    store.set(isCheckingSessionAtom, true);

    async function fetchLoginStatus() {
      try {
        const status = await checkSession();

        setLoginStatus(status);
      } catch {
        navigate('/500');
      } finally {
        store.set(isCheckingSessionAtom, false);
      }
    }

    fetchLoginStatus();
  }, [loginStatus, setLoginStatus, navigate, store]);

  // ログイン済みの場合、続けてユーザー情報を取得
  useEffect(() => {
    if (loginStatus !== 'loggedIn' || isPublicPage || userInfo !== null) {
      return;
    }

    // 2重呼び出し防止
    if (store.get(isFetchingUserInfoAtom)) {
      return;
    }
    store.set(isFetchingUserInfoAtom, true);

    async function fetchUserInfo() {
      try {
        const data = await getUserInfo();

        setUserInfo(data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.replace('/signin');
          return;
        }

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

  // ログイン状況が確認できていない場合は何も表示しない
  if (loginStatus === 'unchecked') {
    return null;
  }

  // ログイン済みなのにゲスト向けの画面にいる場合はホームへ
  if (loginStatus === 'loggedIn' && isPublicPage) {
    return <Navigate to="/" replace />;
  }

  // 未ログインなのに会員向けの画面にいる場合はサインインへ
  if (loginStatus === 'loggedOut' && !isPublicPage) {
    return <Navigate to="/signin" replace />;
  }

  // ログイン済みだがユーザー情報の取得がまだ終わっていない場合は何も表示しない
  if (loginStatus === 'loggedIn' && userInfo === null) {
    return null;
  }

  // 認証チェックを通過したら、実際のページを表示
  return <Outlet />;
}

export default AuthWrapper;
