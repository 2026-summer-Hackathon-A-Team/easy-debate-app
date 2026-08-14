import { Outlet } from 'react-router';

import SocketManager from '../socket/socketManager';

function DebateLayout() {
  return (
    <>
      <SocketManager />
      <Outlet />
    </>
  );
}

export default DebateLayout;
