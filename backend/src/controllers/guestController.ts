import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { importGuestService } from '../services/importGuestService.js';

const prisma = new PrismaClient();

export const getGuests = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const guests = await prisma.guest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(guests);
  } catch (error) {
    console.error('ERRO AO BUSCAR CONVIDADOS:', error);
    return res.status(500).json({ error: 'Erro ao buscar convidados.' });
  }
};

export const createGuest = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { name, group, status, email, phone } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O nome do convidado é obrigatório.' });
    }

    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        group: group || 'Amigos',
        status: status || 'Pendente',
        email: email && email.trim() !== '' ? email.trim() : null,
        phone: phone && phone.trim() !== '' ? phone.trim() : null,
        userId: userId as string,
      },
    });

    return res.status(201).json(guest);
  } catch (error) {
    console.error('ERRO AO CRIAR CONVIDADO:', error);
    return res.status(500).json({ error: 'Erro ao criar convidado.' });
  }
};

export const updateGuest = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, group, status, email, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingGuest = await prisma.guest.findFirst({
      where: { id, userId },
    });

    if (!existingGuest) {
      return res.status(404).json({ error: 'Convidado não encontrado.' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (group !== undefined) updateData.group = group;
    if (status !== undefined) updateData.status = status;
    if (email !== undefined) updateData.email = email && email.trim() !== '' ? email.trim() : null;
    if (phone !== undefined) updateData.phone = phone && phone.trim() !== '' ? phone.trim() : null;

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedGuest);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR CONVIDADO:', error);
    return res.status(500).json({ error: 'Erro ao atualizar convidado.' });
  }
};

export const deleteGuest = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingGuest = await prisma.guest.findFirst({
      where: { id, userId },
    });

    if (!existingGuest) {
      return res.status(404).json({ error: 'Convidado não encontrado.' });
    }

    await prisma.guest.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('ERRO AO DELETAR CONVIDADO:', error);
    return res.status(500).json({ error: 'Erro ao deletar convidado.' });
  }
};

export const importGuests = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { guests } = req.body;

    // Delega o processamento e as regras de negócio para o service dedicado
    const result = await importGuestService(userId, guests);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('ERRO AO IMPORTAR CONVIDADOS:', error);
    return res.status(400).json({ error: error.message || 'Erro ao importar convidados.' });
  }
};