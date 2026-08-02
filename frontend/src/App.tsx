import { Route, Routes, Navigate } from 'react-router';


import DebatePage from './pages/DebatePage';
import HomePage from './pages/HomePage';
import SigninPage from './pages/SigninPage';
import MatchingPage from './pages/MatchingPage';
import NameChangePage from './pages/NameChangePage';
import NotFoundPage from './pages/NotFoundPage';
import PasswordChangePage from './pages/PasswordChangePage';
import SignupPage from './pages/SignupPage';
import JudgeResultPage from './pages/JudgeResultPage';
import TopocConfirmationPage from './pages/TopicConfirmationPage';
import TopicSelectionPage from './pages/TopicSelectionPage';
import ProfilePage from './pages/ProfilePage';
import InternalServerErrorPage from './pages/InternalServerErrorPage';

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SigninPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/debates/matching" element={<MatchingPage />} />
      <Route path="/debates/topic-selection" element={<TopicSelectionPage />} />
      <Route
        path="/debates/topic-confirmation"
        element={<TopocConfirmationPage />}
      />
      <Route path="/debates/chat" element={<DebatePage />} />
      <Route path="/debates/judge" element={<JudgeResultPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/username" element={<NameChangePage />} />
      <Route path="/profile/password" element={<PasswordChangePage />} />
      <Route path="404" element={<NotFoundPage />} />
      <Route path='500' element={<InternalServerErrorPage />} />

      <Route path='*' element={<Navigate to='/404' replace />} />
    </Routes>
  );
}

export default App;
