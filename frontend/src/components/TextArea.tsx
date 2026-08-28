import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  // 入力内容の行数に合わせて高さを自動で伸縮させるか
  autoResize?: boolean;
};

function TextArea({
  className,
  autoResize = false,
  value,
  ...props
}: TextAreaProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textArea = textAreaRef.current;

    if (!autoResize || !textArea) {
      return;
    }

    // 一度高さをautoに戻してからscrollHeightを測る
    // (そうしないと行を減らしたときに縮まらない)
    textArea.style.height = 'auto';

    const style = getComputedStyle(textArea);
    // scrollHeightはborderを含まないので、border-boxならその分を足さないと
    // 常に数px足りずスクロールバーが出てしまう
    const borderHeight =
      style.boxSizing === 'border-box'
        ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
        : 0;
    const contentHeight = textArea.scrollHeight + borderHeight;
    // max-heightが指定されていればそこで頭打ちにする
    const maxHeight = parseFloat(style.maxHeight);
    const nextHeight = Number.isNaN(maxHeight)
      ? contentHeight
      : Math.min(contentHeight, maxHeight);

    textArea.style.height = `${nextHeight}px`;
    // 上限に達したときだけスクロールできるようにする
    textArea.style.overflowY = contentHeight > nextHeight ? 'auto' : 'hidden';
  }, [autoResize, value]);

  return (
    <textarea
      ref={textAreaRef}
      value={value}
      className={twMerge(
        `
          w-full rounded-lg border border-gray-400/50
          px-3 py-3 font-body outline-none resize-none
          focus:border-[#4c7e63]
        `,
        className,
      )}
      {...props}
    />
  );
}

export default TextArea;
export type { TextAreaProps };
