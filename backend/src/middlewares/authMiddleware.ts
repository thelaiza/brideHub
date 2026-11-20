import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida.');
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

interface JwtPayloadWithMeta {
  userId?: string;
  email?: string;
  iat?: number;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Token malformatado ou em formato inválido.' });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({ error: 'Token malformatado ou em formato inválido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as JwtPayloadWithMeta;

    if (!decoded?.userId) {
      return res.status(401).json({ error: 'Token inválido ou payload ausente.' });
    }

    if (typeof prisma.user?.findUnique === 'function') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { passwordChangedAt: true },
      });

      if (user?.passwordChangedAt && typeof decoded.iat === 'number') {
        const changedAtSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < changedAtSeconds) {
          return res.status(401).json({ error: 'Sessão expirada após alteração de senha.' });
        }
      }
    }

    req.userId = decoded.userId;
    if (decoded.email !== undefined) {
      req.userEmail = decoded.email;
    }

    return next();
  } catch (error: any) {
    if (error?.name !== 'TokenExpiredError') {
      console.warn(`Aviso na validação do token: ${error?.name} - ${error?.message}`);
    }
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}