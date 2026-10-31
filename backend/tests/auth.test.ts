/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 

const prisma = new PrismaClient();

describe('Auth API Tests', () => {
  let createdEmail = '';

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

    expect([200, 201]).toContain(response.status);
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
});