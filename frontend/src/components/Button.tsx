import type { ReactNode } from 'react';

type ButtontProps = {
  children: ReactNode;
};

function Button({ children }: ButtontProps) {
  return (
    <button className="rounded-xl py-3 outline-none bg-[#4c7e63] text-white hover:bg-[#3f6a52]">
      {children}
    </button>
  );
}

export default Button;
