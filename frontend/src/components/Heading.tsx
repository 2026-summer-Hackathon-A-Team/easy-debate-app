import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type HeadingProps = {
  level: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
};

const headingStyles = {
  1: 'text-[22px] font-extrabold',
  2: 'text-[18px] font-extrabold',
  3: 'text-[14px] text-gray-500',
};

function Heading({ level, children, className }: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag className={twMerge('font-heading', headingStyles[level], className)}>
      {children}
    </Tag>
  );
}

export default Heading;
