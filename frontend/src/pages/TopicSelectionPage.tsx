import CardLayout from '../Layouts/CardLayout';
import Heading from '../components/Heading';
import Button from '../components/Button';

function TopicSelectionPage() {
  return (
    <>
      <CardLayout>
        <div className="flex flex-col items-center">
          <Heading level={3} className="font-body font-bold text-[#4c7e63]">
            お題選定
          </Heading>
          <div className="grid grid-cols-2 justify-items-center items-center mt-3 rounded-3xl bg-[#e8f0eb] p-3">
            <div className="text-[12px] text-[#2c4d3b] font-body font-bold">
              回答期限
            </div>
            <div className="text-[14px] text-[#2c4d3b] font-body font-extrabold">
              120秒
            </div>
          </div>
          <Heading level={1} className="mt-3">
            お題
          </Heading>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-8 font-bold">
          <Heading level={3} className="col-span-2 text-center">
            お題チェンジ
          </Heading>
          <Button className="bg-white hover:bg-white text-gray-500 border border-gray-300">
            希望する
          </Button>
          <Button>希望しない</Button>
          <Heading
            level={3}
            className="col-span-2 text-center text-gray-400 font-normal mt-1"
          >
            ※両者がチェンジを希望した際に
            <br className="sm:hidden" />
            チェンジされます
          </Heading>
        </div>
      </CardLayout>
    </>
  );
}

export default TopicSelectionPage;
