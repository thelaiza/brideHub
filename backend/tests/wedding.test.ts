/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 
import { createAuthUser } from './helpers/createAuthUser.js';

const prisma = new PrismaClient();

describe('Wedding Configuration API Tests', () => {
  let authToken = '';
  let userId = '';

  const validWedding = {
    bride: 'Laíza',
    groom: 'Marcos',
    date: '2026-10-04T00:00:00.000Z',
    venue: 'Joinville, SC',
    budget: 80000
  };

  beforeAll(async () => {
    const authData = await createAuthUser();
    userId = authData.userId;
    authToken = authData.authToken;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.wedding.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('deve bloquear o acesso à rota de casamento sem token de autenticação', async () => {
    const response = await request(app).put('/api/wedding').send(validWedding);
    expect(response.status).toBe(401);
  });

  it('deve retornar erro 400 se faltarem campos obrigatórios', async () => {
    const response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ bride: 'Laíza' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 se o orçamento for inválido', async () => {
    const response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ...validWedding,
        budget: 'invalido'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 se a data for inválida', async () => {
    const response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ...validWedding,
        date: 'data-errada'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve salvar ou atualizar as informações do casamento com sucesso', async () => {
    const response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validWedding);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.venue).toBe('Joinville, SC');
    expect(response.body.bride).toBe('Laíza');
    expect(response.body.groom).toBe('Marcos');
  });
});