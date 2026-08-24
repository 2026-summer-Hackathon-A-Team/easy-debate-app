import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type CardLayoutProps = {
  children: ReactNode;
  className?: string;
};

function CardLayout({ children, className }: CardLayoutProps) {
  return (
    <div
      className={twMerge(
        'flex flex-1 items-center justify-center px-5 py-10',
        className,
      )}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#e4e2dd] bg-white p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export default CardLayout;
