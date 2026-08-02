import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge'

type ButtonProps = {
  children: ReactNode;
  className?: string 
};

function Button({ children, className}: ButtonProps) {
  return (
    <button className={twMerge ("font-bold rounded-xl py-3 outline-none bg-[#4c7e63] text-white hover:bg-[#3f6a52]", className)}>
      {children}
    </button>
  );
}

export default Button
