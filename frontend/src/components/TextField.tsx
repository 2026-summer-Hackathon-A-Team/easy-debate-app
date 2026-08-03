import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type TextFielType = 'text' | 'password';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type?: TextFielType;
};

function TextField({ className, type = 'text', ...props }: TextFieldProps) {
  return (
    <input
      type={type}
      className={twMerge(
        `
          w-full rounded-lg border border-gray-400/50
          px-3 py-3 font-body outline-none
          focus:border-[#4c7e63]
        `,
        className,
      )}
      {...props}
    />
  );
}

export default TextField;
