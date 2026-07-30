import { Route, Routes } from 'react-router';

import DebatePage from './pages/DebatePage';
import HomePage from './pages/HomePage';
import SigninPage from './pages/SigninPage';
import MatchingPage from './pages/MatchingPage';
import NameChangePage from './pages/NameChangePage';
import NotFoundPage from './pages/NotFoundPage';
import PasswordChangePage from './pages/PasswordChangePage';
import SignupPage from './pages/SignupPage';
import ResultPage from './pages/ResultPage';
import TopocConfirmationPage from './pages/TopicConfirmationPage';
import TopicSelectionPage from './pages/TopicSelectionPage';
import ProfilePage from './pages/ProfilePage';

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
      <Route path="/debates/judge" element={<ResultPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/username" element={<NameChangePage />} />
      <Route path="/profile/password" element={<PasswordChangePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
