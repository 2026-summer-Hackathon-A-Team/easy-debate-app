import type { ReactNode } from 'react';

type CardLayoutProps = {
  children: ReactNode;
};

function CardLayout({ children }: CardLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f1ee] px-5 py-10">
      <div className="w-full max-w-105 rounded-[20px] border border-[#e4e2dd] bg-white px-8 py-10 shadow-[0_1px_2px_rgba(35,40,35,0.04),0_12px_32px_rgba(35,40,35,0.06)]">
        {children}
      </div>
    </div>
  );
}

export default CardLayout;
