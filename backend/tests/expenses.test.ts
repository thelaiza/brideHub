/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js';
import { createAuthUser } from './helpers/createAuthUser.js';

const prisma = new PrismaClient();

describe('Expense Management API Tests', () => {
  let authToken = '';
  let userId = '';
  let expenseId = '';
  let vendorId = '';

  beforeAll(async () => {
    const authData = await createAuthUser();
    userId = authData.userId;
    authToken = authData.authToken;

    const vendor = await prisma.vendor.create({
      data: {
        name: 'Estúdio Luz & Cena',
        category: 'Fotografia e Vídeo',
        status: 'Contratado',
        cost: 4500,
        userId,
      },
    });
    vendorId = vendor.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.expense.deleteMany({ where: { userId } });
      await prisma.vendor.deleteMany({ where: { userId } });
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
    expect(response.body).toHaveLength(0);
  });

  it('deve retornar erro 400 se tentar criar uma despesa sem campos obrigatórios', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: -500,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 se tentar vincular a um fornecedor inexistente ou de outro usuário', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Despesa Fornecedor Inválido',
        amount: 1200,
        category: 'Buffet',
        vendorId: 'id-fornecedor-inexistente',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve criar uma nova despesa vinculada a um fornecedor com sucesso', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Fotógrafo Casamento',
        amount: 4500,
        category: 'Fotografia e Vídeo',
        dueDate: '2026-10-04T00:00:00.000Z',
        status: 'Pendente',
        vendorId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Fotógrafo Casamento');
    expect(response.body.amount).toBe(4500);
    expect(response.body.vendorId).toBe(vendorId);
    expect(response.body.vendor?.name).toBe('Estúdio Luz & Cena');

    expenseId = response.body.id;
  });

  it('deve listar as despesas cadastradas do usuário incluindo dados do fornecedor', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].vendor?.name).toBe('Estúdio Luz & Cena');
  });

  it('deve atualizar os dados de uma despesa existente', async () => {
    const response = await request(app)
      .patch(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 4800,
        status: 'Pago',
      });

    expect(response.status).toBe(200);
    expect(response.body.amount).toBe(4800);
    expect(response.body.status).toBe('Pago');
  });

  it('deve manter a despesa intacta e limpar vendorId se o fornecedor for excluído', async () => {
    await prisma.vendor.delete({ where: { id: vendorId } });

    const response = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    const updatedExpense = response.body.find((item: any) => item.id === expenseId);
    expect(updatedExpense).toBeDefined();
    expect(updatedExpense.vendorId).toBeNull();
    expect(updatedExpense.vendor).toBeNull();
  });

  it('deve retornar erro 404 ao atualizar despesa inexistente', async () => {
    const response = await request(app)
      .patch('/api/expenses/id-falso-inexistente')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 100,
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