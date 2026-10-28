/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 

const prisma = new PrismaClient();

describe('Task Management API Tests', () => {
  let authToken = '';
  let userId = '';
  let taskId = '';

  beforeAll(async () => {
    const uniqueEmail = `tasktest_${Date.now()}@bridehub.com`;
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Noivos Tarefas',
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

  it('deve bloquear o acesso às rotas de tarefas sem token de autenticação', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(401);
  });

  it('deve retornar lista vazia se o usuário não tiver tarefas cadastradas', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('deve retornar erro 400 ao tentar criar tarefa sem título', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'Geral',
        priority: 'Alta'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve criar uma nova tarefa com sucesso', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Escolher os convites de casamento',
        category: 'Papelaria',
        priority: 'Alta',
        status: 'Pendente',
        dueDate: '2026-08-01T00:00:00.000Z'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Escolher os convites de casamento');
    expect(response.body.status).toBe('Pendente');

    taskId = response.body.id;
  });

  it('deve listar as tarefas cadastradas', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('deve atualizar o status de uma tarefa existente', async () => {
    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'Concluído'
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Concluído');
  });

  it('deve retornar erro 404 ao atualizar tarefa inexistente', async () => {
    const response = await request(app)
      .patch('/api/tasks/id-falso-inexistente')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'Concluído'
      });

    expect(response.status).toBe(404);
  });

  it('deve deletar uma tarefa com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
  });

  it('deve retornar erro 404 ao deletar tarefa inexistente', async () => {
    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });
});