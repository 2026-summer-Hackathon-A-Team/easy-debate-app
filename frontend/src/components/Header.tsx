import logo from '../assets/easy-debate-logo.png';

function Header() {
  return (
    <header className="border-b border-[#e4e2dd]">
      <div className="mx-auto h-16 flex flex-raw items-center px-5">
        <img className="flex w-10 h-10" src={logo} alt="easy-debate-app-logo" />
        <h1 className="flex">やさしいディベート</h1>
      </div>
    </header>
  );
}

export default Header;
