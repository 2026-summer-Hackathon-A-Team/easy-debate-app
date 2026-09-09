import type { MouseEventHandler, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = {
  children: ReactNode;
  className?: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

function Button({ children, className, ...buttonProps }: ButtonProps) {
  return (
    <button
      className={twMerge(
        'font-bold rounded-xl py-3 outline-none bg-[#4c7e63] text-white hover:bg-[#3f6a52] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default Button;
