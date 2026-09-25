import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js'; 

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', taskRoutes);
app.use('/api', vendorRoutes);
app.use('/api', dashboardRoutes); 

app.get('/api/status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'online', database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

const PORT = process.env.API_PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});