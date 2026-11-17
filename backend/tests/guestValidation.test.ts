/// <reference types="jest" />

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js';
import { createAuthUser } from './helpers/createAuthUser.js';

const prisma = new PrismaClient();

describe('Guest API - validações e importação (casos de borda)', () => {
  let authToken = '';
  let userId = '';
  let guestId = '';

  const auth = () => ({ Authorization: `Bearer ${authToken}` });

  beforeAll(async () => {
    const authData = await createAuthUser();
    userId = authData.userId;
    authToken = authData.authToken;

    const res = await request(app)
      .post('/api/guests')
      .set(auth())
      .send({ name: 'Base', group: 'Amigos', status: 'Pendente' });
    guestId = res.body.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.guest.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/guests', () => {
    it('deve aplicar grupo e status padrão quando não informados', async () => {
      const res = await request(app).post('/api/guests').set(auth()).send({ name: 'Sem Grupo' });

      expect(res.status).toBe(201);
      expect(res.body.group).toBe('Amigos');
      expect(res.body.status).toBe('Pendente');
    });

    it('deve retornar 400 para status inválido com grupo válido', async () => {
      const res = await request(app)
        .post('/api/guests')
        .set(auth())
        .send({ name: 'Teste', group: 'Amigos', status: 'Talvez' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Status inválido.');
    });
  });

  describe('PATCH /api/guests/:id', () => {
    it('deve retornar 400 ao tentar apagar o nome', async () => {
      const res = await request(app).patch(`/api/guests/${guestId}`).set(auth()).send({ name: '   ' });
      expect(res.status).toBe(400);
    });

    it('deve retornar 400 para status inválido', async () => {
      const res = await request(app).patch(`/api/guests/${guestId}`).set(auth()).send({ status: 'Talvez' });
      expect(res.status).toBe(400);
    });

    it('deve atualizar nome, grupo, status e limpar e-mail e telefone', async () => {
      const res = await request(app)
        .patch(`/api/guests/${guestId}`)
        .set(auth())
        .send({ name: '  Novo Nome  ', group: 'Padrinhos', status: 'Confirmado', email: '', phone: '' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Novo Nome');
      expect(res.body.group).toBe('Padrinhos');
      expect(res.body.email).toBeNull();
      expect(res.body.phone).toBeNull();
    });
  });

  describe('POST /api/guests/import', () => {
    const post = (guests: unknown) =>
      request(app).post('/api/guests/import').set(auth()).send({ guests });

    it('deve recusar convidado sem grupo ou status e informar a linha', async () => {
      const res = await post([{ line: 2, name: 'Ana', group: '', status: '' }]);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Linha 2');
      expect(res.body.error).toContain('campo obrigatório vazio (grupo, status)');
    });

    it('deve recusar grupo e status inválidos', async () => {
      const res = await post([{ line: 3, name: 'Ana', group: 'Vizinhos', status: 'Talvez' }]);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('grupo inválido "Vizinhos"');
      expect(res.body.error).toContain('status inválido "Talvez"');
    });

    it('deve truncar a lista de erros em 5 linhas', async () => {
      const guests = Array.from({ length: 7 }, (_, i) => ({ line: i + 2, name: '', group: 'Amigos', status: 'Pendente' }));
      const res = await post(guests);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('e mais 2 erro(s)');
    });

    it('deve recusar mais de 1000 convidados por importação', async () => {
      const guests = Array.from({ length: 1001 }, (_, i) => ({ name: `G${i}`, group: 'Amigos', status: 'Pendente' }));
      const res = await post(guests);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Limite de 1000');
    });

    it('deve aceitar caracteres especiais e e-mail/telefone ausentes', async () => {
      const res = await post([
        { name: "José D'Ávila 🎉 Çãõ", group: 'Amigos', status: 'Pendente', email: '', phone: null },
      ]);
      expect(res.status).toBe(201);

      const list = await request(app).get('/api/guests').set(auth());
      const saved = list.body.find((g: any) => g.name.startsWith('José'));
      expect(saved.name).toBe("José D'Ávila 🎉 Çãõ");
      expect(saved.email).toBeNull();
      expect(saved.phone).toBeNull();
    });

    it('deve remover o byte nulo em vez de gerar erro 500', async () => {
      const res = await post([{ name: 'Ana\u0000 Lima', group: 'Amigos', status: 'Pendente' }]);
      expect(res.status).toBe(201);

      const list = await request(app).get('/api/guests').set(auth());
      expect(list.body.some((g: any) => g.name === 'Ana Lima')).toBe(true);
    });
  });
});