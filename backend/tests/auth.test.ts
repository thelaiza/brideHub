/// <reference types="jest" />

import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import app from '../src/server.js';
import {
  AuthError,
  loginWithCredentials,
  normalizeEmail,
  registerUser,
  resetPassword,
} from '../src/services/authService.js';

const prisma = new PrismaClient();

const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

describe('Auth API Tests', () => {
  const prefix = `authtest_${Date.now()}`;
  const emailFor = (label: string) => `${prefix}_${label}@bridehub.com`;
  const createdEmail = emailFor('main');
  const originalResendKey = process.env.RESEND_API_KEY;
  let authToken = '';

  const createPasswordUser = async (label: string, password = 'securepassword123') =>
    prisma.user.create({
      data: {
        name: `Usuário ${label}`,
        email: emailFor(label),
        password: await bcrypt.hash(password, 10),
      },
    });

  const createGoogleUser = async (label: string) =>
    prisma.user.create({
      data: { name: `Google ${label}`, email: emailFor(label), password: '' },
    });

  const setResetToken = async (userId: string, rawToken: string, expires: Date) =>
    prisma.user.update({
      where: { id: userId },
      data: { resetPasswordToken: hashToken(rawToken), resetPasswordExpires: expires },
    });

  beforeAll(() => {
    // Sem chave, o emailService só registra um aviso e não faz chamadas externas.
    delete process.env.RESEND_API_KEY;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.$disconnect();
    jest.restoreAllMocks();
    if (originalResendKey !== undefined) {
      process.env.RESEND_API_KEY = originalResendKey;
    }
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuário Auth',
          email: createdEmail,
          password: 'securepassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createdEmail);
    });

    it('não deve expor senha nem campos de redefinição na resposta', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Sem Segredos', email: emailFor('safe'), password: 'securepassword123' });

      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('resetPasswordToken');
      expect(response.body).not.toHaveProperty('resetPasswordExpires');
    });

    it('não deve permitir registrar usuário com e-mail duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuário Duplicado',
          email: createdEmail,
          password: 'securepassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve tratar e-mail duplicado sem diferenciar maiúsculas de minúsculas', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuário Duplicado',
          email: createdEmail.toUpperCase(),
          password: 'securepassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('E-mail já está em uso.');
    });

    it('deve normalizar o e-mail para minúsculas ao registrar', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuário Maiúsculo',
          email: emailFor('upper').toUpperCase(),
          password: 'securepassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(emailFor('upper'));
    });

    it('deve rejeitar cadastro sem nome, e-mail ou senha', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: '', email: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nome, e-mail e senha são obrigatórios.');
    });

    it('deve rejeitar senha com menos de 8 caracteres', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Senha Curta', email: emailFor('short'), password: '1234567' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/pelo menos 8/);

      const user = await prisma.user.findUnique({ where: { email: emailFor('short') } });
      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso usando credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: createdEmail,
          password: 'securepassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(createdEmail);
      authToken = response.body.token;
    });

    it('deve fazer login com o e-mail em maiúsculas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: createdEmail.toUpperCase(), password: 'securepassword123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: createdEmail,
          password: 'senhaerrada',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve rejeitar login de e-mail não cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: emailFor('inexistente'), password: 'qualquercoisa' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Credenciais inválidas.');
    });

    it('deve rejeitar login por senha em conta criada pelo Google', async () => {
      await createGoogleUser('login-google');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: emailFor('login-google'), password: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Credenciais inválidas.');
    });

    it('deve rejeitar login com corpo vazio', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('me', () => {
    it('deve retornar os dados do perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('email');
      }
    });
  });

  describe('google', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    const mockGooglePayload = (payload: Record<string, unknown>) =>
      jest
        .spyOn(OAuth2Client.prototype, 'verifyIdToken')
        .mockResolvedValue({ getPayload: () => payload } as never);

    it('deve rejeitar quando o token não for enviado', async () => {
      const response = await request(app).post('/api/auth/google').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token do Google não fornecido.');
    });

    it('deve retornar 401 para token do Google inválido', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({ token: 'token-invalido' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token do Google inválido ou expirado.');
    });

    it('deve rejeitar quando o payload não tem e-mail', async () => {
      mockGooglePayload({ name: 'Sem Email' });

      const response = await request(app).post('/api/auth/google').send({ token: 'x' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Não foi possível validar o e-mail do Google.');
    });

    it('deve rejeitar quando o e-mail do Google não está verificado', async () => {
      mockGooglePayload({ email: emailFor('google-unverified'), email_verified: false });

      const response = await request(app).post('/api/auth/google').send({ token: 'x' });

      expect(response.status).toBe(400);
    });

    it('deve criar o usuário no primeiro login com Google', async () => {
      const email = emailFor('google-new');
      mockGooglePayload({ email: email.toUpperCase(), name: 'Maria Google', email_verified: true });

      const response = await request(app).post('/api/auth/google').send({ token: 'x' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.name).toBe('Maria Google');

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user?.password).toBe('');
    });

    it('deve reutilizar o usuário existente nos próximos logins', async () => {
      const email = emailFor('google-again');
      mockGooglePayload({ email, name: 'Repetida', email_verified: true });

      await request(app).post('/api/auth/google').send({ token: 'x' });
      const second = await request(app).post('/api/auth/google').send({ token: 'x' });

      expect(second.status).toBe(200);
      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });

    it('deve usar o nome padrão quando o Google não envia nome', async () => {
      const email = emailFor('google-noname');
      mockGooglePayload({ email, email_verified: true });

      const response = await request(app).post('/api/auth/google').send({ token: 'x' });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Usuário Google');
    });
  });

  describe('forgot-password', () => {
    it('deve exigir o e-mail', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Informe o e-mail cadastrado.');
    });

    it('deve responder de forma genérica para e-mail não cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: emailFor('nao-existe') });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/Se o e-mail estiver cadastrado/);
    });

    it('deve gerar token e expiração de 30 minutos para conta com senha', async () => {
      const user = await createPasswordUser('forgot');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: `  ${emailFor('forgot').toUpperCase()}  ` });

      expect(response.status).toBe(200);

      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.resetPasswordToken).toHaveLength(64);
      expect(updated?.resetPasswordExpires).not.toBeNull();

      const expires = updated!.resetPasswordExpires!.getTime();
      expect(expires).toBeGreaterThan(Date.now());
      expect(expires).toBeLessThanOrEqual(Date.now() + 31 * 60 * 1000);
    });

    it('deve responder igual para e-mail existente e inexistente', async () => {
      await createPasswordUser('forgot-same');

      const existing = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: emailFor('forgot-same') });
      const missing = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: emailFor('forgot-missing') });

      expect(existing.status).toBe(missing.status);
      expect(existing.body).toEqual(missing.body);
    });

    it('não deve gerar token para conta criada pelo Google', async () => {
      const user = await createGoogleUser('forgot-google');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: emailFor('forgot-google') });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/Se o e-mail estiver cadastrado/);

      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.resetPasswordToken).toBeNull();
    });
  });

  describe('reset-password', () => {
    it('deve exigir token e nova senha', async () => {
      const response = await request(app).post('/api/auth/reset-password').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token e nova senha são obrigatórios.');
    });

    it('deve rejeitar senha com menos de 8 caracteres', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'qualquer', password: '1234567' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/pelo menos 8/);
    });

    it('deve rejeitar token inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'token-que-nao-existe', password: 'novasenha456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Link de redefinição inválido ou expirado.');
    });

    it('deve rejeitar token expirado', async () => {
      const user = await createPasswordUser('reset-expired');
      await setResetToken(user.id, 'token-expirado', new Date(Date.now() - 60 * 1000));

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'token-expirado', password: 'novasenha456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Link de redefinição inválido ou expirado.');
    });

    it('não deve definir senha em conta criada pelo Google', async () => {
      const user = await createGoogleUser('reset-google');
      await setResetToken(user.id, 'token-google', new Date(Date.now() + 10 * 60 * 1000));

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'token-google', password: 'novasenha456' });

      expect(response.status).toBe(400);

      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.password).toBe('');
    });

    it('deve redefinir a senha, invalidar o token e permitir login com a nova senha', async () => {
      const user = await createPasswordUser('reset-ok', 'senhaantiga123');
      await setResetToken(user.id, 'token-valido', new Date(Date.now() + 10 * 60 * 1000));

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'token-valido', password: 'novasenha456' });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/Senha redefinida com sucesso/);

      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.resetPasswordToken).toBeNull();
      expect(updated?.resetPasswordExpires).toBeNull();
      expect(updated?.passwordChangedAt).not.toBeNull();

      const loginNew = await request(app)
        .post('/api/auth/login')
        .send({ email: emailFor('reset-ok'), password: 'novasenha456' });
      expect(loginNew.status).toBe(200);

      const loginOld = await request(app)
        .post('/api/auth/login')
        .send({ email: emailFor('reset-ok'), password: 'senhaantiga123' });
      expect(loginOld.status).toBe(400);

      const reuse = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'token-valido', password: 'outrasenha789' });
      expect(reuse.status).toBe(400);
    });
  });

  describe('authMiddleware', () => {
    const secret = process.env.JWT_SECRET as string;

    it('deve retornar 401 se nenhum cabeçalho de autorização for fornecido', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Token não fornecido.' });
    });

    it('deve retornar 401 se o cabeçalho não começar com Bearer', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic token123');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar 401 se o token estiver vazio após o prefixo Bearer', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer   ');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Token malformatado ou em formato inválido.' });
    });

    it('deve retornar 401 se o token JWT for inválido ou falsificado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidtoken.signature');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Token inválido ou expirado.' });
    });

    it('deve retornar 401 para token expirado', async () => {
      const expired = jwt.sign({ userId: 'x' }, secret, { expiresIn: -10 });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expired}`);

      expect(response.status).toBe(401);
    });

    it('deve retornar 401 para token assinado com outro segredo', async () => {
      const forged = jwt.sign({ userId: 'x' }, 'segredo-errado');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forged}`);

      expect(response.status).toBe(401);
    });

    it('deve retornar 401 para token válido sem id de usuário no payload', async () => {
      const semId = jwt.sign({ foo: 'bar' }, secret);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${semId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('authService unit helpers & validation', () => {
    it('deve normalizar e-mails corretamente e rejeitar não-strings', () => {
      expect(normalizeEmail('  User@BrideHub.COM  ')).toBe('user@bridehub.com');
      expect(normalizeEmail(null)).toBe('');
      expect(normalizeEmail({ email: 'a@b.com' })).toBe('');
    });

    it('deve rejeitar senha passada como objeto em registerUser sem virar "[object Object]"', async () => {
      await expect(
        registerUser({
          name: 'Teste',
          email: emailFor('unit-obj-pass'),
          password: { toString: () => 'senhaValida123' },
        })
      ).rejects.toThrow(AuthError);
    });

    it('deve rejeitar senha não-string em loginWithCredentials e resetPassword', async () => {
      await expect(
        loginWithCredentials({ email: emailFor('unit-login'), password: {} })
      ).rejects.toThrow('Credenciais inválidas.');

      await expect(
        resetPassword({ token: 'abc', password: {} })
      ).rejects.toThrow('Token e nova senha são obrigatórios.');
    });
  });
});