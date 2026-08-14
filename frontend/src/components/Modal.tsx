import type { ReactNode } from 'react';

type ModalProps = {
  children: ReactNode;
};

function Modal({ children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(35,40,35,0.4)] px-5">
      <div className="w-full max-w-[360px] rounded-[20px] bg-white px-[30px] py-[34px] text-center">
        {children}
      </div>
    </div>
  );
}

export default Modal;
