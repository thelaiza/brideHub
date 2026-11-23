import { PrismaClient, type User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { sendPasswordResetEmail, sendGoogleAccountEmail } from './emailService.js';

const prisma = new PrismaClient();

export const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos
const RESET_COOLDOWN_MS = 60 * 1000; // 1 minuto entre emissões de token

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.';

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export type SafeUser = Omit<
  User,
  'password' | 'resetPasswordToken' | 'resetPasswordExpires' | 'passwordChangedAt'
>;

let googleClient: OAuth2Client | null = null;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definido no .env');
  }
  return secret;
}

function getGoogleClientId(): string {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID não definido no .env');
  }
  return clientId;
}

function getGoogleClient(): OAuth2Client {
  const clientId = getGoogleClientId();
  googleClient ??= new OAuth2Client(clientId);
  return googleClient;
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePassword(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function signToken(user: { id: string; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

function toSafeUser(user: User): SafeUser {
  const {
    password: _,
    resetPasswordToken: __,
    resetPasswordExpires: ___,
    passwordChangedAt: ____,
    ...safeUser
  } = user;

  return safeUser;
}

export async function registerUser(input: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}): Promise<SafeUser> {
  const name = normalizeText(input.name);
  const email = normalizeEmail(input.email);
  const password = normalizePassword(input.password);

  if (!name || !email || !password) {
    throw new AuthError(400, 'Nome, e-mail e senha são obrigatórios.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(400, `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AuthError(400, 'E-mail já está em uso.');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return toSafeUser(user);
}

export async function loginWithCredentials(input: {
  email?: unknown;
  password?: unknown;
}): Promise<AuthSession> {
  const email = normalizeEmail(input.email);
  const password = normalizePassword(input.password);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) {
    throw new AuthError(400, 'Credenciais inválidas.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError(400, 'Credenciais inválidas.');
  }

  return {
    token: signToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function loginWithGoogle(token?: unknown): Promise<AuthSession> {
  const normalizedToken = normalizeText(token);

  if (!normalizedToken) {
    throw new AuthError(400, 'Token do Google não fornecido.');
  }

  try {
    const client = getGoogleClient();
    const audience = getGoogleClientId();

    const ticket = await client.verifyIdToken({
      idToken: normalizedToken,
      audience,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified === false) {
      throw new AuthError(400, 'Não foi possível validar o e-mail do Google.');
    }

    const email = normalizeEmail(payload.email);
    const name = normalizeText(payload.name);

    let user = await prisma.user.findUnique({ where: { email } });

    user ??= await prisma.user.create({
      data: {
        name: name || 'Usuário Google',
        email,
        password: '',
      },
    });

    return {
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    console.error('Erro na autenticação Google:', error);
    throw new AuthError(401, 'Token do Google inválido ou expirado.');
  }
}

export async function requestPasswordReset(rawEmail?: unknown): Promise<{ message: string }> {
  const email = normalizeEmail(rawEmail);

  if (!email) {
    throw new AuthError(400, 'Informe o e-mail cadastrado.');
  }

  const genericResponse = { message: GENERIC_FORGOT_PASSWORD_MESSAGE };

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return genericResponse;
  }

  if (!user.password) {
    sendGoogleAccountEmail(user.email, user.name).catch((emailError) => {
      console.error(`[forgot-password] falha ao enviar aviso (userId: ${user.id}):`, emailError);
    });
    return genericResponse;
  }

  const now = Date.now();
  const existingTokenValid =
    Boolean(user.resetPasswordToken) &&
    Boolean(user.resetPasswordExpires) &&
    user.resetPasswordExpires!.getTime() > now;

  if (existingTokenValid && user.resetPasswordExpires) {
    const remainingMs = user.resetPasswordExpires.getTime() - now;
    const elapsedSinceIssueMs = RESET_TOKEN_TTL_MS - remainingMs;
    if (elapsedSinceIssueMs < RESET_COOLDOWN_MS) {
      return genericResponse;
    }
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(now + RESET_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expiresAt,
    },
  });

  sendPasswordResetEmail(user.email, user.name, rawToken).catch((emailError) => {
    console.error(`[forgot-password] falha ao enviar e-mail (userId: ${user.id}):`, emailError);
  });

  return genericResponse;
}

export async function resetPassword(input: {
  token?: unknown;
  password?: unknown;
}): Promise<{ message: string }> {
  const token = normalizeText(input.token);
  const password = normalizePassword(input.password);

  if (!token || !password) {
    throw new AuthError(400, 'Token e nova senha são obrigatórios.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      400,
      `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    );
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
    throw new AuthError(400, 'Link de redefinição inválido ou expirado.');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      passwordChangedAt: new Date(),
    },
  });

  return { message: 'Senha redefinida com sucesso! Você já pode fazer login.' };
}