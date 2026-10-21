import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const updateWedding = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { bride, groom, date, venue, budget } = req.body;

    if (!bride || !groom || !date || !venue || budget === undefined || budget === '') {
      return res.status(400).json({ error: 'Todos os campos do casamento são obrigatórios.' });
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({ error: 'O orçamento deve ser um valor numérico válido.' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Data do casamento inválida.' });
    }

    const formattedDate = parsedDate.toISOString();

    const wedding = await prisma.wedding.upsert({
      where: { userId },
      update: { 
        bride, 
        groom, 
        date: formattedDate, 
        venue, 
        budget: parsedBudget 
      },
      create: {
        userId,
        bride,
        groom,
        date: formattedDate,
        venue,
        budget: parsedBudget,
      },
    });

    return res.json(wedding);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR CASAMENTO:', error);
    return res.status(500).json({ error: 'Erro ao atualizar dados do casamento.' });
  }
};