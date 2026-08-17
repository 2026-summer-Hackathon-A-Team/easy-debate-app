import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';

import App from './App.tsx';
import MainLayout from './Layouts/MainLayout.tsx';
import { setupMock } from './mocks';

// モック有効時のみ、コンソールに案内を表示（本番ビルドでは何もしない）
setupMock();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MainLayout>
        <App />
      </MainLayout>
    </BrowserRouter>
  </StrictMode>,
);
