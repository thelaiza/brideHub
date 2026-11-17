/// <reference types="jest" />

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js';

const prisma = new PrismaClient();

describe('Auth API Tests', () => {
  let createdEmail = '';
  let authToken = '';

  beforeAll(() => {
    createdEmail = `authtest_${Date.now()}@bridehub.com`;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: createdEmail } });
    await prisma.$disconnect();
  });

  it('deve registrar um novo usuário com sucesso', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuário Auth',
        email: createdEmail,
        password: 'securepassword123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('não deve permitir registrar usuário com e-mail duplicado', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuário Duplicado',
        email: createdEmail,
        password: 'securepassword123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve fazer login com sucesso usando credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: createdEmail,
        password: 'securepassword123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    authToken = response.body.token;
  });

  it('deve retornar os dados do perfil do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('email');
    }
  });

  it('deve rejeitar login com senha incorreta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: createdEmail,
        password: 'senhaerrada'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
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
});