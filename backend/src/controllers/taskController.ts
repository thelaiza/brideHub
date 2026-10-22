import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getTasks = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tasks);
  } catch (error) {
    console.error('ERRO AO BUSCAR TAREFAS:', error);
    return res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { title, description, category, status, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
    }

    const taskStatus = status || 'todo';
    const isCompleted = taskStatus === 'done';

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        category: category || 'Geral',
        status: taskStatus,
        completed: isCompleted,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: userId as string,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('ERRO AO CRIAR TAREFA:', error);
    return res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { title, description, category, status, dueDate, completed } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) {
      updateData.status = status;
      updateData.completed = status === 'done';
    }
    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
      updateData.status = completed ? 'done' : 'todo';
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR TAREFA:', error);
    return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('ERRO AO DELETAR TAREFA:', error);
    return res.status(500).json({ error: 'Erro ao deletar tarefa.' });
  }
};