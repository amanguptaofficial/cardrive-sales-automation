import { Server } from 'socket.io';

let io = null;

import { env } from './config/env.js';

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('user:join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`User ${userId} joined their room`);
      }
    });

    socket.on('chat:join', (chatId) => {
      if (chatId) {
        socket.join(chatId.toString());
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
      }
    });

    socket.on('chat:leave', (chatId) => {
      if (chatId) {
        socket.leave(chatId.toString());
        console.log(`Socket ${socket.id} left chat ${chatId}`);
      }
    });

    socket.on('chat:typing', ({ chatId, userId, isTyping }) => {
      socket.to(chatId.toString()).emit('chat:typing', {
        chatId,
        userId,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => io;

export { io };
