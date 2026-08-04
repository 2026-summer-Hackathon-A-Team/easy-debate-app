import logo from '../assets/easy-debate-logo.png';
import Heading from '../components/Heading';

function Header() {
  return (
    <header className="bg-white border-b border-[#e4e2dd]">
      <div className="mx-auto h-16 flex flex-raw items-center px-5">
        <img className="flex w-10 h-10" src={logo} alt="easy-debate-app-logo" />
        <Heading level={2} className="flex ml-3">
          やさしいディベート
        </Heading>
      </div>
    </header>
  );
}

export default Header;
