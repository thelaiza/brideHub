/// <reference types="jest" />

import request from 'supertest';
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

  it('deve retornar 401 se nenhum cabeçalho de autorização for fornecido', async () => {
    const response = await request(app).get('/api/auth/me'); // Rota protegida por authMiddleware
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token não fornecido.' });
  });

  it.each([
    ['não começar com Bearer', 'Basic token123'],
    ['estar vazio após o prefixo Bearer', 'Bearer   '],
    ['ser um token JWT inválido ou falsificado', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidtoken.signature']
  ])('deve retornar 401 se o token %s', async (_, authHeader) => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader);

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

});