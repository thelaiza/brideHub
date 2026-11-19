import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { sendPasswordResetEmail, sendGoogleAccountEmail } from '../services/emailService.js';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error('VITE_GOOGLE_CLIENT_ID não definido no .env');
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const MIN_PASSWORD_LENGTH = 6;

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const signToken = (user: { id: string; email: string }) =>
  jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

router.post('/auth/register', async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, resetPasswordToken: __, resetPasswordExpires: ___, ...safeUser } = user;
    return res.status(201).json(safeUser);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    return res.json({
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    return res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

router.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body as { token?: string };

    if (!token) {
      return res.status(400).json({ error: 'Token do Google não fornecido.' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified === false) {
      return res.status(400).json({ error: 'Não foi possível validar o e-mail do Google.' });
    }

    const email = normalizeEmail(payload.email);
    const name = payload.name;

    let user = await prisma.user.findUnique({ where: { email } });

    user ??= await prisma.user.create({
      data: {
        name: name || 'Usuário Google',
        email,
        password: '',
      },
    });

    return res.json({
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erro na autenticação Google:', error);
    return res.status(401).json({ error: 'Token do Google inválido ou expirado.' });
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
    }

    const genericResponse = {
      message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.',
    };

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log('[forgot-password] nenhum usuário encontrado para o e-mail informado.');
      return res.json(genericResponse);
    }

    // Conta criada pelo Google (password === ''): a senha é gerenciada pelo Google.
    if (!user.password) {
      console.log(`[forgot-password] conta Google (userId: ${user.id}), enviando aviso.`);
      try {
        await sendGoogleAccountEmail(user.email, user.name);
      } catch (emailError) {
        console.error(`[forgot-password] falha ao enviar aviso (userId: ${user.id}):`, emailError);
      }
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    });

    console.log(`[forgot-password] token gerado (userId: ${user.id}), enviando e-mail...`);

    try {
      await sendPasswordResetEmail(user.email, user.name, rawToken);
      console.log(`[forgot-password] e-mail enviado (userId: ${user.id}).`);
    } catch (emailError) {
      console.error(`[forgot-password] falha ao enviar e-mail (userId: ${user.id}):`, emailError);
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Erro em forgot-password:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação de redefinição de senha.' });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user?.password) {
      return res.status(400).json({ error: 'Link de redefinição inválido ou expirado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (error) {
    console.error('Erro em reset-password:', error);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

export default router;