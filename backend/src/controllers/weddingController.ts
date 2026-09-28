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

    const wedding = await prisma.wedding.upsert({
      where: { userId },
      update: { 
        bride, 
        groom, 
        date, 
        venue, 
        budget: budget ? Number(budget) : 0 
      },
      create: {
        userId,
        bride,
        groom,
        date,
        venue,
        budget: budget ? Number(budget) : 0,
      },
    });

    return res.json(wedding);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR CASAMENTO:', error);
    return res.status(500).json({ error: 'Erro ao atualizar dados do casamento.' });
  }
};