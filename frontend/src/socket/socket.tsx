import { io } from 'socket.io-client';
import { VITE_API_URL } from '../config/env';

const socket = io(VITE_API_URL, {
  withCredentials: true,
  autoConnect: false,
});

export { socket };
