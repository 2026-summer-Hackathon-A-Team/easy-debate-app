import { useNavigate } from 'react-router';

import Heading from '../components/Heading';
import Button from '../components/Button';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 items-center justify-center px-5 pb-10">
      <div className="w-full max-w-[440px] text-center">
        <p className="text-[15px] font-extrabold tracking-[0.06em] text-[#4c7e63]">
          ERROR 404
        </p>
        <Heading level={1} className="mt-5 text-[#232823]">
          ページが見つかりません
        </Heading>
        <p className="mt-3 text-sm leading-[1.8] text-[#8a8f89]">
          お探しのページは削除されたか、
          <br />
          URLが間違っている可能性があります。
        </p>
        <Button className="mt-8 px-10 py-3.5" onClick={() => navigate('/')}>
          ホームへ戻る
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
