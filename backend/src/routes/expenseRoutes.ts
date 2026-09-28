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
      return res.status(401).json({ error: 'Utilizador não autenticado.' });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(expenses);
  } catch (error) {
    console.error('ERRO AO BUSCAR DESPESAS:', error);
    return res.status(500).json({ error: 'Erro ao buscar despesas.' });
  }
});

router.post('/expenses', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const { title, category, amount, dueDate, status } = req.body;

    if (!title || !category || amount === undefined) {
      return res.status(400).json({ error: 'Título, categoria e valor são obrigatórios.' });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        category,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'pending',
        userId: userId as string,
      },
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('ERRO AO CRIAR DESPESA:', error);
    return res.status(500).json({ error: 'Erro ao criar despesa.' });
  }
});

router.patch('/expenses/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { title, category, amount, dueDate, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Utilizador não autenticado.' });
    }

    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedExpense);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR DESPESA:', error);
    return res.status(500).json({ error: 'Erro ao atualizar despesa.' });
  }
});

router.delete('/expenses/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Utilizador não autenticado.' });
    }

    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('ERRO AO DELETAR DESPESA:', error);
    return res.status(500).json({ error: 'Erro ao deletar despesa.' });
  }
});

export default router;