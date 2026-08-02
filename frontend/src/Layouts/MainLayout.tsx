import type { ReactNode } from 'react';
import Header from '../components/Header'

type MainLayoutProps = {
  children: ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f2f1ee]">
      <Header />

      <main className='flex flex-1 min-h-0 flex-col'>
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
