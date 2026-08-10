import Heading from '../components/Heading';

function MatchingPage() {
  return (
    <>
      <div className="flex flex-col items-center mt-5">
        <div className="h-18 w-18 animate-spin rounded-full border-6 border-[#cfe1d6] border-t-[#4c7e63]" />
        <Heading level={1} className="mt-5">
          対戦相手を探しています...
        </Heading>
        <div className="mt-5 rounded-2xl border border-[#e4e2dd] bg-[#e8f0eb] p-5">
          <div className="text-[#2c4d3b] font-body font-bold">
            時間切れでも諦めないで！
          </div>
          <div className="text-[#2c4d3b] font-body font-bold">
            入力途中でも送信されます。
          </div>
        </div>
      </div>
    </>
  );
}

export default MatchingPage;
