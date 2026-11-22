import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getTables = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const tables = await prisma.table.findMany({
      where: { userId },
      include: {
        guests: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(tables);
  } catch (error) {
    console.error('ERRO AO BUSCAR MESAS:', error);
    return res.status(500).json({ error: 'Erro ao buscar mesas.' });
  }
};

export const createTable = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const cleanName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!cleanName) {
      return res.status(400).json({ error: 'O nome da mesa é obrigatório.' });
    }

    const existingTable = await prisma.table.findFirst({
      where: { userId, name: cleanName },
    });

    if (existingTable) {
      return res.status(400).json({ error: 'Já existe uma mesa com este nome.' });
    }

    const table = await prisma.table.create({
      data: {
        name: cleanName.slice(0, 60),
        userId,
      },
      include: {
        guests: true,
      },
    });

    return res.status(201).json(table);
  } catch (error) {
    console.error('ERRO AO CRIAR MESA:', error);
    return res.status(500).json({ error: 'Erro ao criar mesa.' });
  }
};

export const deleteTable = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingTable = await prisma.table.findFirst({
      where: { id, userId },
    });

    if (!existingTable) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    await prisma.$transaction([
      prisma.guest.updateMany({
        where: { userId, tableId: id },
        data: { tableId: null, table: null },
      }),
      prisma.table.delete({
        where: { id },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error('ERRO AO DELETAR MESA:', error);
    return res.status(500).json({ error: 'Erro ao deletar mesa.' });
  }
};

export const assignGuestToTable = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const tableId = String(req.params.id);
    const guestId = typeof req.body?.guestId === 'string' ? req.body.guestId.trim() : '';

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!guestId) {
      return res.status(400).json({ error: 'O convidado é obrigatório.' });
    }

    const table = await prisma.table.findFirst({
      where: { id: tableId, userId },
    });

    if (!table) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, userId },
    });

    if (!guest) {
      return res.status(404).json({ error: 'Convidado não encontrado.' });
    }

    if (guest.tableId || guest.table) {
      return res.status(400).json({
        error: `Este convidado já está alocado na mesa "${guest.table}". Remova-o dela antes de mover.`,
      });
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        tableId: table.id,
        table: table.name,
      },
    });

    return res.json(updatedGuest);
  } catch (error) {
    console.error('ERRO AO ADICIONAR CONVIDADO NA MESA:', error);
    return res.status(500).json({ error: 'Erro ao adicionar convidado na mesa.' });
  }
};

export const removeGuestFromTable = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const tableId = String(req.params.id);
    const guestId = String(req.params.guestId);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const table = await prisma.table.findFirst({
      where: { id: tableId, userId },
    });

    if (!table) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, userId, tableId },
    });

    if (!guest) {
      return res.status(404).json({ error: 'Convidado não encontrado nesta mesa.' });
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        tableId: null,
        table: null,
      },
    });

    return res.json(updatedGuest);
  } catch (error) {
    console.error('ERRO AO REMOVER CONVIDADO DA MESA:', error);
    return res.status(500).json({ error: 'Erro ao remover convidado da mesa.' });
  }
};