import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

const vendorInclude = {
  vendor: {
    select: {
      id: true,
      name: true,
      category: true,
    },
  },
};

const validateUserVendor = async (
  vendorId: unknown,
  userId: string
): Promise<string | null | { error: string }> => {
  if (vendorId === undefined || vendorId === null || vendorId === '') {
    return null;
  }

  if (typeof vendorId !== 'string') {
    return { error: 'Fornecedor inválido.' };
  }

  const normalizedVendorId = vendorId.trim();
  if (!normalizedVendorId) {
    return null;
  }

  const vendor = await prisma.vendor.findFirst({
    where: { id: normalizedVendorId, userId },
  });

  if (!vendor) {
    return { error: 'Fornecedor não encontrado.' };
  }

  return vendor.id;
};

export const getExpenses = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: vendorInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(expenses);
  } catch (error) {
    console.error('ERRO AO BUSCAR DESPESAS:', error);
    return res.status(500).json({ error: 'Erro ao buscar despesas.' });
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { title, category, amount, dueDate, status, vendorId } = req.body;

    if (!title || !category || amount === undefined) {
      return res.status(400).json({ error: 'Título, categoria e valor são obrigatórios.' });
    }

    const resolvedVendor = await validateUserVendor(vendorId, userId);
    if (resolvedVendor && typeof resolvedVendor === 'object') {
      return res.status(400).json({ error: resolvedVendor.error });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        category,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'pending',
        vendorId: resolvedVendor,
        userId: userId as string,
      },
      include: vendorInclude,
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('ERRO AO CRIAR DESPESA:', error);
    return res.status(500).json({ error: 'Erro ao criar despesa.' });
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { title, category, amount, dueDate, status, vendorId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
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
    if (vendorId !== undefined) {
      const resolvedVendor = await validateUserVendor(vendorId, userId);
      if (resolvedVendor && typeof resolvedVendor === 'object') {
        return res.status(400).json({ error: resolvedVendor.error });
      }
      updateData.vendorId = resolvedVendor;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: vendorInclude,
    });

    return res.json(updatedExpense);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR DESPESA:', error);
    return res.status(500).json({ error: 'Erro ao atualizar despesa.' });
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
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
};