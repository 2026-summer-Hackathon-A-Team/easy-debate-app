import { twMerge } from 'tailwind-merge';

import TextField, { type TextFieldProps } from './TextField';

type ValidatedTextFieldProps = TextFieldProps & {
  id: string;
  label: string;
  // 入力欄の下に表示するNGメッセージ。未指定/空文字の場合は表示しない
  errorMessage?: string;
  // ラベル(外側のlabel要素)に付与するclassName
  wrapperClassName?: string;
};

// ラベル+入力欄+バリデーションNGメッセージをまとめたフォーム部品。
// 有効/無効の判定自体は呼び出し元(各schema)が行い、結果のメッセージだけを受け取る
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
