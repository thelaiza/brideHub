import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return res.status(401).json({ error: 'Token malformatado ou em formato inválido.' });
  }

  const token = match[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: string; email: string };
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}