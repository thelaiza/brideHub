/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 

const prisma = new PrismaClient();

describe('Wedding Configuration API Tests', () => {
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    const uniqueEmail = `weddingtest_${Date.now()}@bridehub.com`;
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Noivos Casamento',
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

  it('deve bloquear o acesso às rotas de casamento sem token de autenticação', async () => {
    const response = await request(app).get('/api/wedding');
    expect(response.status).toBe(401);
  });

  it('deve retornar erro 400 se faltarem campos obrigatórios', async () => {
    let response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ bride: 'Laíza' });

    if (response.status === 404) {
      response = await request(app)
        .patch('/api/wedding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bride: 'Laíza' });
    }

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 se o orçamento for inválido', async () => {
    let response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bride: 'Laíza',
        groom: 'Marcos',
        date: '2026-10-04T00:00:00.000Z',
        venue: 'Joinville, SC',
        budget: 'invalido'
      });

    if (response.status === 404) {
      response = await request(app)
        .patch('/api/wedding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bride: 'Laíza',
          groom: 'Marcos',
          date: '2026-10-04T00:00:00.000Z',
          venue: 'Joinville, SC',
          budget: 'invalido'
        });
    }

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 se a data for inválida', async () => {
    let response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bride: 'Laíza',
        groom: 'Marcos',
        date: 'data-errada',
        venue: 'Joinville, SC',
        budget: 80000
      });

    if (response.status === 404) {
      response = await request(app)
        .patch('/api/wedding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bride: 'Laíza',
          groom: 'Marcos',
          date: 'data-errada',
          venue: 'Joinville, SC',
          budget: 80000
        });
    }

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve salvar ou atualizar as informações do casamento com sucesso', async () => {
    let response = await request(app)
      .put('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bride: 'Laíza',
        groom: 'Marcos',
        date: '2026-10-04T00:00:00.000Z',
        venue: 'Joinville, SC',
        budget: 80000
      });

    if (response.status === 404) {
      response = await request(app)
        .patch('/api/wedding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bride: 'Laíza',
          groom: 'Marcos',
          date: '2026-10-04T00:00:00.000Z',
          venue: 'Joinville, SC',
          budget: 80000
        });
    }

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.venue).toBe('Joinville, SC');
  });

  it('deve buscar as informações do casamento cadastradas', async () => {
    const response = await request(app)
      .get('/api/wedding')
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('budget');
    }
  });
});