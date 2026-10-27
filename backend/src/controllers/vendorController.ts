import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getVendors = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const vendors = await prisma.vendor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(vendors);
  } catch (error) {
    console.error('ERRO AO BUSCAR FORNECEDORES:', error);
    return res.status(500).json({ error: 'Erro ao buscar fornecedores.' });
  }
};

export const createVendor = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { name, category, phone, email, status, cost } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Nome e categoria do fornecedor são obrigatórios.' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        category,
        phone: phone || null,
        email: email || null, 
        status: status || 'Contratado',
        cost: cost !== undefined && cost !== '' ? Number(cost) : 0,
        userId: userId as string,
      },
    });

    return res.status(201).json(vendor);
  } catch (error) {
    console.error('ERRO AO CRIAR FORNECEDOR:', error);
    return res.status(500).json({ error: 'Erro ao criar fornecedor.' });
  }
};

export const updateVendor = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, category, phone, email, status, cost } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingVendor = await prisma.vendor.findFirst({
      where: { id, userId },
    });

    if (!existingVendor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email; 
    if (status !== undefined) updateData.status = status;
    if (cost !== undefined) updateData.cost = Number(cost);

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedVendor);
  } catch (error) {
    console.error('ERRO AO ATUALIZAR FORNECEDOR:', error);
    return res.status(500).json({ error: 'Erro ao atualizar fornecedor.' });
  }
};

export const deleteVendor = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const existingVendor = await prisma.vendor.findFirst({
      where: { id, userId },
    });

    if (!existingVendor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    }

    await prisma.vendor.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('ERRO AO DELETAR FORNECEDOR:', error);
    return res.status(500).json({ error: 'Erro ao deletar fornecedor.' });
  }
};