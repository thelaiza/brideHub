/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 

const prisma = new PrismaClient();

describe('Expense Management API Tests', () => {
  let authToken = '';
  let userId = '';
  let expenseId = '';

  beforeAll(async () => {
    const uniqueEmail = `expensetest_${Date.now()}@bridehub.com`;
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Noivos Despesas',
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

  it('deve bloquear o acesso às rotas de despesas sem token de autenticação', async () => {
    const response = await request(app).get('/api/expenses');
    expect(response.status).toBe(401);
  });

  it('deve retornar lista vazia se o usuário não tiver despesas cadastradas', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('deve retornar erro 400 se tentar criar uma despesa sem campos obrigatórios', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: -500 // Exemplo de dado inválido ou incompleto
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve criar uma nova despesa com sucesso', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Fotógrafo Casamento',
        amount: 4500,
        category: 'Fotografia e Vídeo',
        dueDate: '2026-10-04T00:00:00.000Z',
        status: 'Pendente'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Fotógrafo Casamento');
    expect(response.body.amount).toBe(4500);

    expenseId = response.body.id;
  });

  it('deve listar as despesas cadastradas do usuário', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('deve atualizar os dados de uma despesa existente', async () => {
    const response = await request(app)
      .patch(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 4800,
        status: 'Pago'
      });

    expect(response.status).toBe(200);
    expect(response.body.amount).toBe(4800);
    expect(response.body.status).toBe('Pago');
  });

  it('deve retornar erro 404 ao atualizar despesa inexistente', async () => {
    const response = await request(app)
      .patch('/api/expenses/id-falso-inexistente')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 100
      });

    expect(response.status).toBe(404);
  });

  it('deve deletar uma despesa com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
  });

  it('deve retornar erro 404 ao deletar despesa inexistente', async () => {
    const response = await request(app)
      .delete(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });
});