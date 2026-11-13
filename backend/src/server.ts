import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import weddingRoutes from './routes/weddingRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import { client } from './services/metrics.service.js';
import { metricsMiddleware } from './middlewares/metricsMiddleware.js';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'test') {
    process.env.JWT_SECRET = 'test_jwt_secret_default_key';
  } else {
    console.error('ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida.');
    process.exit(1);
  }
}

export const getAllowedOrigins = (value: string | undefined = process.env.CORS_ORIGINS) =>
  value ? value.split(',').map((origin) => origin.trim()) : '*';

const prisma = new PrismaClient();
const app = express();

app.disable('x-powered-by');

app.use(cors({ origin: getAllowedOrigins() }));
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', taskRoutes);
app.use('/api', vendorRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', weddingRoutes);
app.use('/api', categoryRoutes);

app.get('/api/status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'online', database: 'connected' });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metricsData = await client.register.metrics();
    return res.end(metricsData);
  } catch (ex) {
    console.error('Erro ao coletar métricas:', ex);
    return res.status(500).end('Internal Server Error collecting metrics');
  }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.API_PORT || 3333;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}