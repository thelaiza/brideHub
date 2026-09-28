import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/expenses', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId }, 
      orderBy: { createdAt: 'desc' },
    });

    return res.json(expenses);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar despesas.' });
  }
});

router.post('/expenses', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const { title, category, amount, dueDate } = req.body;

    if (!title || !category || !amount) {
      return res.status(400).json({ error: 'Título, categoria e valor são obrigatórios.' });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        category,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: userId as string,
      },
    });

    return res.status(201).json(expense);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar despesa.' });
  }
});

export default router;