import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import {
  importGuestService,
  ImportValidationError,
  clean,
  VALID_GROUPS,
  VALID_STATUSES,
} from '../services/importGuestService.js';

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

    const cleanName = clean(name);
    if (!cleanName) {
      return res.status(400).json({ error: 'O nome do convidado é obrigatório.' });
    }

    const cleanGroup = clean(group) || 'Amigos';
    const cleanStatus = clean(status) || 'Pendente';

    if (!(VALID_GROUPS as readonly string[]).includes(cleanGroup)) {
      return res.status(400).json({ error: 'Grupo inválido.' });
    }
    if (!(VALID_STATUSES as readonly string[]).includes(cleanStatus)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const guest = await prisma.guest.create({
      data: {
        name: cleanName.slice(0, 80),
        group: cleanGroup,
        status: cleanStatus,
        email: clean(email).slice(0, 120) || null,
        phone: clean(phone).slice(0, 30) || null,
        userId,
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

    const updateData: Record<string, string | null> = {};

    if (name !== undefined) {
      const cleanName = clean(name);
      if (!cleanName) {
        return res.status(400).json({ error: 'O nome do convidado é obrigatório.' });
      }
      updateData.name = cleanName.slice(0, 80);
    }

    if (group !== undefined) {
      const cleanGroup = clean(group);
      if (!(VALID_GROUPS as readonly string[]).includes(cleanGroup)) {
        return res.status(400).json({ error: 'Grupo inválido.' });
      }
      updateData.group = cleanGroup;
    }

    if (status !== undefined) {
      const cleanStatus = clean(status);
      if (!(VALID_STATUSES as readonly string[]).includes(cleanStatus)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }
      updateData.status = cleanStatus;
    }

    if (email !== undefined) updateData.email = clean(email).slice(0, 120) || null;
    if (phone !== undefined) updateData.phone = clean(phone).slice(0, 30) || null;

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

    const result = await importGuestService(userId, req.body?.guests);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('ERRO AO IMPORTAR CONVIDADOS:', error);

    if (error instanceof ImportValidationError) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Erro ao importar convidados.' });
  }
};