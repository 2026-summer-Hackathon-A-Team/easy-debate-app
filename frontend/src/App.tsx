import { Route, Routes, Navigate } from 'react-router';

import AuthWrapper from './components/AuthWrapper';
import DebatePage from './pages/DebatePage';
import HomePage from './pages/HomePage';
import SigninPage from './pages/SigninPage';
import MatchingPage from './pages/MatchingPage';
import NameChangePage from './pages/NameChangePage';
import NotFoundPage from './pages/NotFoundPage';
import PasswordChangePage from './pages/PasswordChangePage';
import SignupPage from './pages/SignupPage';
import JudgeResultPage from './pages/JudgeResultPage';
import TopicConfirmationPage from './pages/TopicConfirmationPage';
import TopicSelectionPage from './pages/TopicSelectionPage';
import ProfilePage from './pages/ProfilePage';
import InternalServerErrorPage from './pages/InternalServerErrorPage';
import SocketManager from './socket/socketManager';

function App() {
  return (
    <Routes>
      <Route element={<AuthWrapper />}>
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<HomePage />} />

        <Route element={<SocketManager />}>
          <Route path="/debates/matching" element={<MatchingPage />} />
          <Route
            path="/debates/topic-selection"
            element={<TopicSelectionPage />}
          />
          <Route
            path="/debates/topic-confirmation"
            element={<TopicConfirmationPage />}
          />
          <Route path="/debates/chat" element={<DebatePage />} />
          <Route path="/debates/judge" element={<JudgeResultPage />} />
        </Route>

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/username" element={<NameChangePage />} />
        <Route path="/profile/password" element={<PasswordChangePage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<InternalServerErrorPage />} />

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
