import { io } from 'socket.io-client';
import { env } from '../config/env.js';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(env.SOCKET_URL, {
      transports: ['websocket'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
