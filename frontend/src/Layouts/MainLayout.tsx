import type { ReactNode } from 'react';
import Header from '../components/Header';

type MainLayoutProps = {
  children: ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-dvh bg-[#f2f1ee]">
      <Header />

      <main className="min-h-0 pt-8 md:pt-16">{children}</main>
    </div>
  );
}

export default MainLayout;
