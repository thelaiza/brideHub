/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 

const prisma = new PrismaClient();

describe('Dashboard API Tests', () => {
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    const uniqueEmail = `dashboardtest_${Date.now()}@bridehub.com`;
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Noivos Dashboard',
        email: uniqueEmail,
        password: 'password123',
      });

    userId = registerResponse.body.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('deve bloquear o acesso ao dashboard sem token de autenticação', async () => {
    const response = await request(app).get('/api/dashboard');
    expect(response.status).toBe(401);
  });

  it('deve retornar os dados consolidados do dashboard com sucesso', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });
});