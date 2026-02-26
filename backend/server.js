import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/database.js';
import { initializeSocket } from './src/socket.js';
import { errorHandler } from './src/utils/errors.js';
import { logger } from './src/utils/logger.js';

import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import leadRoutes from './src/routes/lead.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import webhookRoutes from './src/routes/webhook.routes.js';
import rulesRoutes from './src/routes/rules.routes.js';
import csvRoutes from './src/routes/csv.routes.js';
import sequenceRoutes from './src/routes/sequence.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import integrationRoutes from './src/routes/integration.routes.js';
import reminderRoutes from './src/routes/reminder.routes.js';
import templateRoutes from './src/routes/template.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';

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

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);

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
