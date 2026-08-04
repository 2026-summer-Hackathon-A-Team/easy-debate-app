import CardLayout from '../Layouts/CardLayout';
import Heading from '../components/Heading';
import Button from '../components/Button';

function HomePage() {
  return (
    <>
      <Heading level={1} className="text-center text-[26px]">
        気軽にディベートしてみませんか？
      </Heading>
      <CardLayout>
        <div>
          <Heading level={2} className="text-center font-bold">
            やさしいマッチでディベート開始
          </Heading>
        </div>

        <div className="w-full text-center mt-2">
          <p className="text-[14px] text-gray-500">
            モラルが近い方同士がマッチング。
          </p>
        </div>

        <div className="w-full text-center mt-5">
          <p className="text-[14px] text-gray-500">
            ※対戦後のお礼をするとモラルが上がり、
          </p>
          <p className="text-[14px] text-gray-500">
            途中離脱や誹謗中傷をするとモラルが下がります。
          </p>
        </div>

        <Button className="w-full mt-5">ディベート開始</Button>
      </CardLayout>
    </>
  );
}

export default HomePage;
