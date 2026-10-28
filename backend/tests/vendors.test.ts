/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js'; 

const prisma = new PrismaClient();

describe('Vendor Management API Tests', () => {
  let authToken = '';
  let userId = '';
  let vendorId = '';

  beforeAll(async () => {
    const uniqueEmail = `testuser_${Date.now()}@bridehub.com`;
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Noivos Teste',
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

  it('deve bloquear o acesso às rotas de fornecedores sem token de autenticação', async () => {
    const response = await request(app).get('/api/vendors');
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar lista vazia se o usuário ainda não tiver fornecedores', async () => {
    const response = await request(app)
      .get('/api/vendors')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('deve retornar erro 400 se tentar criar um fornecedor sem nome ou categoria', async () => {
    const response = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phone: '47988887777',
        cost: 1000
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve criar um novo fornecedor com sucesso incluindo o e-mail', async () => {
    const response = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Buffet Sabor & Arte',
        category: 'Buffet',
        phone: '47988887777',
        email: 'contato@saborarte.com',
        cost: 15000,
        status: 'Contratado'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Buffet Sabor & Arte');
    expect(response.body.email).toBe('contato@saborarte.com');
    
    vendorId = response.body.id;
  });

  it('deve listar os fornecedores do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/vendors')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('email');
  });

  it('deve atualizar o e-mail e os dados do fornecedor existente', async () => {
    const response = await request(app)
      .patch(`/api/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'novoemail@saborarte.com',
        cost: 16000
      });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('novoemail@saborarte.com');
    expect(response.body.cost).toBe(16000);
  });

  it('deve retornar erro 404 ao tentar atualizar um fornecedor inexistente', async () => {
    const response = await request(app)
      .patch('/api/vendors/id-falso-inexistente')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Teste Inexistente'
      });

    expect(response.status).toBe(404);
  });

  it('deve deletar um fornecedor com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
  });

  it('deve retornar erro 404 ao tentar deletar um fornecedor já excluído ou inexistente', async () => {
    const response = await request(app)
      .delete(`/api/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });
});