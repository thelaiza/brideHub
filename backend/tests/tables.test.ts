/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js';
import { createAuthUser } from './helpers/createAuthUser.js';

const prisma = new PrismaClient();

describe('Table Management API Tests', () => {
  let authToken = '';
  let userId = '';
  let tableId = '';
  let secondTableId = '';
  let guestId = '';

  beforeAll(async () => {
    const authData = await createAuthUser();
    userId = authData.userId;
    authToken = authData.authToken;

    const guest = await prisma.guest.create({
      data: {
        name: 'Convidado Teste Mesa',
        group: 'Amigos',
        status: 'Confirmado',
        email: `convidado.mesa.${Date.now()}@teste.com`,
        phone: '47999998888',
        userId,
      },
    });
    guestId = guest.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.guest.deleteMany({ where: { userId } });
      await prisma.table.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('deve bloquear o acesso às rotas de mesas sem token de autenticação', async () => {
    const getRes = await request(app).get('/api/tables');
    expect(getRes.status).toBe(401);

    const postRes = await request(app).post('/api/tables').send({ name: 'Mesa 1' });
    expect(postRes.status).toBe(401);

    const deleteRes = await request(app).delete('/api/tables/123');
    expect(deleteRes.status).toBe(401);

    const assignRes = await request(app).post('/api/tables/123/guests').send({ guestId });
    expect(assignRes.status).toBe(401);

    const removeRes = await request(app).delete(`/api/tables/123/guests/${guestId}`);
    expect(removeRes.status).toBe(401);
  });

  it('deve retornar lista vazia se o usuário ainda não tiver mesas', async () => {
    const response = await request(app)
      .get('/api/tables')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  it('deve retornar erro 400 se tentar criar uma mesa sem nome ou com nome vazio', async () => {
    const emptyRes = await request(app)
      .post('/api/tables')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '   ' });

    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body).toHaveProperty('error');

    const invalidTypeRes = await request(app)
      .post('/api/tables')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 123 });

    expect(invalidTypeRes.status).toBe(400);
  });

  it('deve criar uma nova mesa com sucesso', async () => {
    const response = await request(app)
      .post('/api/tables')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '  Mesa 1  ' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Mesa 1');
    expect(Array.isArray(response.body.guests)).toBe(true);
    tableId = response.body.id;

    const secondRes = await request(app)
      .post('/api/tables')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Mesa 2' });

    expect(secondRes.status).toBe(201);
    secondTableId = secondRes.body.id;
  });

  it('deve retornar erro 400 ao tentar criar mesa com nome duplicado (inclusive case-insensitive)', async () => {
    const response = await request(app)
      .post('/api/tables')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'mesa 1' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve listar as mesas do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/tables')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
  });

  it('deve validar erros ao adicionar convidado na mesa (guestId ausente, mesa inexistente, convidado inexistente)', async () => {
    const noGuestRes = await request(app)
      .post(`/api/tables/${tableId}/guests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(noGuestRes.status).toBe(400);

    const noTableRes = await request(app)
      .post('/api/tables/id-mesa-inexistente/guests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ guestId });

    expect(noTableRes.status).toBe(404);

    const unknownGuestRes = await request(app)
      .post(`/api/tables/${tableId}/guests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ guestId: 'id-convidado-inexistente' });

    expect(unknownGuestRes.status).toBe(404);
  });

  it('deve alocar convidado na mesa e preencher tableId no banco', async () => {
    const response = await request(app)
      .post(`/api/tables/${tableId}/guests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ guestId });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(guestId);
    expect(response.body.tableId).toBe(tableId);
    expect(response.body.table).toBe('Mesa 1');
  });

  it('deve impedir adicionar o mesmo convidado em outra mesa ou novamente na mesma mesa', async () => {
    const response = await request(app)
      .post(`/api/tables/${secondTableId}/guests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ guestId });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve validar erros ao remover convidado da mesa (mesa inexistente ou convidado não está na mesa)', async () => {
    const wrongTableRes = await request(app)
      .delete(`/api/tables/id-mesa-inexistente/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(wrongTableRes.status).toBe(404);

    const wrongGuestRes = await request(app)
      .delete(`/api/tables/${secondTableId}/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(wrongGuestRes.status).toBe(404);
  });

  it('deve remover convidado da mesa e limpar tableId no banco', async () => {
    const response = await request(app)
      .delete(`/api/tables/${tableId}/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(guestId);
    expect(response.body.tableId).toBeNull();
    expect(response.body.table).toBeNull();
  });

  it('deve retornar erro 404 ao tentar deletar mesa inexistente', async () => {
    const response = await request(app)
      .delete('/api/tables/id-mesa-inexistente')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('deve deletar a mesa e liberar os convidados vinculados a ela', async () => {
    await request(app)
      .post(`/api/tables/${tableId}/guests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ guestId });

    const deleteRes = await request(app)
      .delete(`/api/tables/${tableId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(204);

    const guestAfterDelete = await prisma.guest.findUnique({ where: { id: guestId } });
    expect(guestAfterDelete?.tableId).toBeNull();
  });
});