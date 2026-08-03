import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type CardLayoutProps = {
  children: ReactNode;
  className?: string;
  cardClassName?: string;
};

function CardLayout({ children, className, cardClassName }: CardLayoutProps) {
  return (
    <div
      className={twMerge(
        'flex flex-1 items-center justify-center px-5 py-10,',
        className,
      )}
    >
      <div
        className={twMerge(
          'w-full max-w-md rounded-2xl border border-[#e4e2dd] bg-white p-8 shadow-lg',
          cardClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default CardLayout;
