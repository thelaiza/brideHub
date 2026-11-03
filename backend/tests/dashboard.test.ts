/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 
import { createAuthUser } from './helpers/createAuthUser.js';

const prisma = new PrismaClient();

describe('Dashboard API Tests', () => {
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    const authData = await createAuthUser();
    userId = authData.userId;
    authToken = authData.authToken;
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