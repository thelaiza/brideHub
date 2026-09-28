import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/tasks', async (req: AuthenticatedRequest, res) => {
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
});

router.post('/tasks', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const { title, description, dueDate, completed } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: completed ?? false,
        userId: userId as string,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('ERRO AO CRIAR TAREFA:', error); 
    return res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
});

router.patch('/tasks/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { title, description, dueDate, completed } = req.body;

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
    if (completed !== undefined) updateData.completed = completed;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

router.delete('/tasks/:id', async (req: AuthenticatedRequest, res) => {
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
    return res.status(500).json({ error: 'Erro ao deletar tarefa.' });
  }
});

export default router;