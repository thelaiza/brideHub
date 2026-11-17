import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const VALID_GROUPS = [
  'Família da noiva',
  'Família do noivo',
  'Amigos',
  'Padrinhos',
  'Fornecedores',
] as const;

export const VALID_STATUSES = ['Pendente', 'Confirmado', 'Negado'] as const;

export interface GuestImportInput {
  line?: number;
  name?: string;
  group?: string;
  status?: string;
  email?: string | null;
  phone?: string | null;
}

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

const MAX_GUESTS_PER_IMPORT = 1000;
const MAX_ERRORS_SHOWN = 5;

export const clean = (v?: string | null): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, '').trim() : '';

const formatErrors = (errors: string[]): string => {
  const shown = errors.slice(0, MAX_ERRORS_SHOWN).join('\n');
  const rest = errors.length - MAX_ERRORS_SHOWN;
  return rest > 0 ? `${shown}\n... e mais ${rest} erro(s).` : shown;
};

export const importGuestService = async (userId: string, guests: GuestImportInput[]) => {
  if (!Array.isArray(guests) || guests.length === 0) {
    throw new ImportValidationError('Nenhum convidado fornecido para importação.');
  }

  if (guests.length > MAX_GUESTS_PER_IMPORT) {
    throw new ImportValidationError(
      `Limite de ${MAX_GUESTS_PER_IMPORT} convidados por importação excedido.`
    );
  }

  const errors: string[] = [];
  const parsedGuests: {
    name: string;
    group: string;
    status: string;
    email: string | null;
    phone: string | null;
    userId: string;
  }[] = [];

  guests.forEach((g, index) => {
    const line = typeof g?.line === 'number' ? g.line : index + 1;
    const name = clean(g?.name);
    const group = clean(g?.group);
    const status = clean(g?.status);

    const missing: string[] = [];
    if (!name) missing.push('nome');
    if (!group) missing.push('grupo');
    if (!status) missing.push('status');

    if (missing.length) {
      errors.push(`Linha ${line}: campo obrigatório vazio (${missing.join(', ')}).`);
      return;
    }

    let rowHasError = false;
    if (!(VALID_GROUPS as readonly string[]).includes(group)) {
      errors.push(`Linha ${line}: grupo inválido "${group}".`);
      rowHasError = true;
    }
    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
      errors.push(`Linha ${line}: status inválido "${status}".`);
      rowHasError = true;
    }
    if (rowHasError) return;

    parsedGuests.push({
      name: name.slice(0, 80),
      group,
      status,
      email: clean(g.email).slice(0, 120) || null,
      phone: clean(g.phone).slice(0, 30) || null,
      userId,
    });
  });

  if (errors.length) {
    throw new ImportValidationError(formatErrors(errors));
  }

  try {
    const existingGuests = await prisma.guest.findMany({
      where: { userId },
      select: { email: true, name: true },
    });

    const existingEmails = new Set(
      existingGuests.map((g) => g.email?.toLowerCase()).filter(Boolean)
    );
    const existingNames = new Set(existingGuests.map((g) => g.name.toLowerCase()));

    const guestsToCreate: typeof parsedGuests = [];
    let skippedCount = 0;

    for (const item of parsedGuests) {
      const emailKey = item.email ? item.email.toLowerCase() : null;
      const nameKey = item.name.toLowerCase();

      const isDuplicate =
        (emailKey && existingEmails.has(emailKey)) || existingNames.has(nameKey);

      if (isDuplicate) {
        skippedCount++;
      } else {
        guestsToCreate.push(item);
        if (emailKey) existingEmails.add(emailKey);
        existingNames.add(nameKey);
      }
    }

    let createdCount = 0;
    if (guestsToCreate.length > 0) {
      const result = await prisma.guest.createMany({ data: guestsToCreate });
      createdCount = result.count;
    }

    let message = `${createdCount} convidado(s) importado(s) com sucesso.`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} convidado(s) já existente(s) foram ignorados).`;
    }

    return {
      count: createdCount,
      skipped: skippedCount,
      message,
    };
  } catch (dbError) {
    console.error('ERRO DETALHADO DO PRISMA NA IMPORTAÇÃO:', dbError);
    throw dbError;
  }
};