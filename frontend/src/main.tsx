import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import MainLayout from './Layouts/MainLayout.tsx';
import { setupMock } from './mocks';

// モック有効時のみ、コンソールに案内を表示（本番ビルドでは何もしない）
setupMock();

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <MainLayout>
      {/* 画面側で拾いきれなかった例外を受け止める(ヘッダーは残したいのでMainLayoutの内側) */}
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MainLayout>
  </BrowserRouter>,
);
