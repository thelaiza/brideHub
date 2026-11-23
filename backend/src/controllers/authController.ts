import type { Request, Response } from 'express';
import {
  AuthError,
  loginWithCredentials,
  loginWithGoogle,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from '../services/authService.js';

function handleAuthError(
  res: Response,
  error: unknown,
  logPrefix: string,
  fallbackMessage: string
): Response {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logPrefix}:`, error);
  return res.status(500).json({ error: fallbackMessage });
}

export async function register(req: Request, res: Response): Promise<Response> {
  try {
    const safeUser = await registerUser({
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
    });

    return res.status(201).json(safeUser);
  } catch (error) {
    return handleAuthError(res, error, 'Erro ao registrar usuário', 'Erro ao registrar usuário.');
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
  try {
    const session = await loginWithCredentials({
      email: req.body?.email,
      password: req.body?.password,
    });

    return res.json(session);
  } catch (error) {
    return handleAuthError(res, error, 'Erro ao realizar login', 'Erro ao realizar login.');
  }
}

export async function googleAuth(req: Request, res: Response): Promise<Response> {
  try {
    const session = await loginWithGoogle(req.body?.token);
    return res.json(session);
  } catch (error) {
    return handleAuthError(
      res,
      error,
      'Erro na autenticação Google',
      'Token do Google inválido ou expirado.'
    );
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  try {
    const response = await requestPasswordReset(req.body?.email);
    return res.json(response);
  } catch (error) {
    return handleAuthError(
      res,
      error,
      'Erro em forgot-password',
      'Erro ao processar solicitação de redefinição de senha.'
    );
  }
}

export async function handleResetPassword(req: Request, res: Response): Promise<Response> {
  try {
    const response = await resetPassword({
      token: req.body?.token,
      password: req.body?.password,
    });

    return res.json(response);
  } catch (error) {
    return handleAuthError(res, error, 'Erro em reset-password', 'Erro ao redefinir senha.');
  }
}