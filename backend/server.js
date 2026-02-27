import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/database.js';
import { initializeSocket } from './src/socket.js';
import { errorHandler } from './src/utils/errors.js';
import { logger } from './src/utils/logger.js';
import apiRoutes from './src/routes/index.js';

import './src/workers/score.worker.js';
import './src/workers/respond.worker.js';
import './src/workers/drip.worker.js';
import './src/workers/escalation.worker.js';

const app = express();
const server = createServer(app);

initializeSocket(server);

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: "*"
}));

app.use('/api/v1', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

connectDB().then(() => {
  server.listen(env.PORT, () => {
    logger.success(`Server running on port ${env.PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use. Please stop the other process or change the PORT in .env`);
      logger.info(`To find and kill the process: lsof -ti:${env.PORT} | xargs kill -9`);
    } else {
      logger.error('Server error:', err);
    }
    process.exit(1);
  });
}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
