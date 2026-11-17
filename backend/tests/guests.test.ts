/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js';
import { createAuthUser } from './helpers/createAuthUser.js';

const prisma = new PrismaClient();

describe('Guest Management & Import API Tests', () => {
  let authToken = '';
  let userId = '';
  let guestId = '';

  beforeAll(async () => {
    const authData = await createAuthUser();
    userId = authData.userId;
    authToken = authData.authToken;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.guest.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('deve bloquear o acesso às rotas de convidados sem token de autenticação', async () => {
    const response = await request(app).get('/api/guests');
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar lista vazia se o usuário ainda não tiver convidados', async () => {
    const response = await request(app)
      .get('/api/guests')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  it('deve retornar erro 400 se tentar criar um convidado sem nome', async () => {
    const response = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        group: 'Amigos',
        status: 'Pendente',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 se tentar criar um convidado com grupo ou status inválido', async () => {
    const response = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Teste Inválido',
        group: 'GrupoInexistente',
        status: 'StatusInexistente',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve criar um novo convidado com sucesso incluindo e-mail e telefone', async () => {
    const response = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Maria Exemplo',
        group: 'Família da noiva',
        status: 'Pendente',
        email: 'maria@email.com',
        phone: '(47) 99999-0000',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Maria Exemplo');
    expect(response.body.group).toBe('Família da noiva');
    expect(response.body.email).toBe('maria@email.com');

    guestId = response.body.id;
  });

  it('deve listar os convidados do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/guests')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('name');
  });

  it('deve atualizar o status e os dados do convidado existente', async () => {
    const response = await request(app)
      .patch(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'Confirmado',
        phone: '(47) 98888-1111',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Confirmado');
    expect(response.body.phone).toBe('(47) 98888-1111');
  });

  it('deve retornar erro 404 ao tentar atualizar um convidado inexistente', async () => {
    const response = await request(app)
      .patch('/api/guests/id-falso-inexistente')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Teste Inexistente',
      });

    expect(response.status).toBe(404);
  });

  it('deve importar convidados em lote com sucesso via endpoint de importação', async () => {
    const response = await request(app)
      .post('/api/guests/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        guests: [
          {
            name: 'Convidado Lote 1',
            group: 'Padrinhos',
            status: 'Confirmado',
            email: 'lote1@email.com',
          },
          {
            name: 'Convidado Lote 2',
            group: 'Amigos',
            status: 'Pendente',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('count', 2);
    expect(response.body).toHaveProperty('message');
  });

  it('deve ignorar convidados duplicados na importação e relatar os ignorados', async () => {
    const response = await request(app)
      .post('/api/guests/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        guests: [
          {
            name: 'Convidado Lote 1', 
            group: 'Padrinhos',
            status: 'Confirmado',
            email: 'lote1@email.com', 
          },
          {
            name: 'Convidado Novo Exclusivo',
            group: 'Família do noivo',
            status: 'Confirmado',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('count', 1); 
    expect(response.body).toHaveProperty('skipped', 1); 
    expect(response.body.message).toContain('ignorado');
  });

  it('deve retornar erro 400 ao tentar importar lote vazio ou formato inválido', async () => {
    const response = await request(app)
      .post('/api/guests/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        guests: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 400 ao importar lote contendo itens com dados inválidos', async () => {
    const response = await request(app)
      .post('/api/guests/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        guests: [
          {
            name: '',
            group: 'Amigos',
            status: 'Pendente',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve deletar um convidado com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
  });

  it('deve retornar erro 404 ao tentar deletar um convidado já excluído ou inexistente', async () => {
    const response = await request(app)
      .delete(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('deve retornar erro 400 ao tentar atualizar um convidado com dados inválidos', async () => {
    const tempGuest = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Convidado Temp Validação',
        group: 'Amigos',
        status: 'Pendente',
      });

    const tempId = tempGuest.body.id;

    const response = await request(app)
      .patch(`/api/guests/${tempId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        group: 'GrupoInvalido',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');

    await request(app)
      .delete(`/api/guests/${tempId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  it('deve retornar erro 401 se o token JWT for inválido ou malformado no middleware', async () => {
    const response = await request(app)
      .get('/api/guests')
      .set('Authorization', 'Bearer token_invalido_fake');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro 401 se o header Authorization não começar com Bearer', async () => {
    const response = await request(app)
      .get('/api/guests')
      .set('Authorization', 'Basic 123456');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});