import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const [expenses, tasks, vendors] = await Promise.all([
      prisma.expense.findMany({ where: { userId } }),
      prisma.task.findMany({ where: { userId } }),
      prisma.vendor.findMany({ where: { userId } }),
    ]);

    const totalExpensesAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const paidExpensesAmount = expenses
      .filter((e) => e.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    const totalVendors = vendors.length;
    const contractedVendors = vendors.filter((v) => v.status === 'contracted').length;

    return res.json({
      summary: {
        expenses: {
          totalCount: expenses.length,
          totalAmount: totalExpensesAmount,
          paidAmount: paidExpensesAmount,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
        },
        vendors: {
          total: totalVendors,
          contracted: contractedVendors,
        },
      },
    });
  } catch (error) {
    console.error('ERRO AO BUSCAR DADOS DO DASHBOARD:', error);
    return res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
});

export default router;