import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GuestImportInput {
  name?: string;
  group?: string;
  status?: string;
  email?: string | null;
  phone?: string | null;
}

export const importGuestService = async (userId: string, guests: GuestImportInput[]) => {
  if (!Array.isArray(guests) || guests.length === 0) {
    throw new Error('Nenhum convidado fornecido para importação.');
  }

  const guestsData = guests.map((g, index) => {
    const name = g.name?.trim();
    const group = g.group?.trim();
    const status = g.status?.trim();

    if (!name || !group || !status) {
      throw new Error(`Linha ${index + 1}: Os campos Nome, Grupo e Status são obrigatórios.`);
    }

    return {
      name,
      group,
      status,
      email: g.email && g.email.trim() !== '' ? g.email.trim() : null,
      phone: g.phone && g.phone.trim() !== '' ? g.phone.trim() : null,
      userId,
    };
  });

  const result = await prisma.guest.createMany({
    data: guestsData,
  });

  return {
    count: result.count,
    message: `${result.count} convidados importados com sucesso.`,
  };
};