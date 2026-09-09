import { twMerge } from 'tailwind-merge';

import TextField, { type TextFieldProps } from './TextField';

type ValidatedTextFieldProps = TextFieldProps & {
  id: string;
  label: string;
  // 入力欄の下に表示するNGメッセージ
  errorMessage?: string;
  // ラベル（外側のlabel要素）に付与するclass名
  wrapperClassName?: string;
};

// ラベル, 入力欄, バリデーションNGメッセージをまとめたフォーム部品
function ValidatedTextField({
  id,
  label,
  errorMessage,
  wrapperClassName,
  ...textFieldProps
}: ValidatedTextFieldProps) {
  return (
    <label
      htmlFor={id}
      className={twMerge('flex flex-col gap-1.5', wrapperClassName)}
    >
      <p className="text-[13px] font-bold gap-4">{label}</p>
      <TextField id={id} {...textFieldProps} />
      {errorMessage && (
        <p className="text-[12px] text-red-500">{errorMessage}</p>
      )}
    </label>
  );
}

export default ValidatedTextField;
