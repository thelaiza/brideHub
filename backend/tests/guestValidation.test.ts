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

  const createGuest = async (data: Record<string, unknown>) => {
    const res = await request(app).post('/api/guests').set(auth()).send(data);
    return res.body;
  };

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

  describe('GET /api/guests', () => {
    it('deve listar os convidados do usuário', async () => {
      const res = await request(app).get('/api/guests').set(auth());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((g: any) => g.id === guestId)).toBe(true);
    });
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

    it('deve retornar 400 quando o nome está vazio', async () => {
      const res = await request(app)
        .post('/api/guests')
        .set(auth())
        .send({ name: '   ', group: 'Amigos', status: 'Pendente' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('O nome do convidado é obrigatório.');
    });

    it('deve retornar 400 para grupo inválido', async () => {
      const res = await request(app)
        .post('/api/guests')
        .set(auth())
        .send({ name: 'Teste', group: 'Vizinhos', status: 'Pendente' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Grupo inválido.');
    });

    it('deve retornar 400 para e-mail já cadastrado', async () => {
      const email = `dup_create_${Date.now()}@email.com`;
      const first = await request(app)
        .post('/api/guests')
        .set(auth())
        .send({ name: 'Primeiro', group: 'Amigos', status: 'Pendente', email });
      expect(first.status).toBe(201);

      const res = await request(app)
        .post('/api/guests')
        .set(auth())
        .send({ name: 'Segundo', group: 'Amigos', status: 'Pendente', email });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe um convidado cadastrado com este e-mail.');
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

    it('deve retornar 400 para grupo inválido', async () => {
      const res = await request(app).patch(`/api/guests/${guestId}`).set(auth()).send({ group: 'Vizinhos' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Grupo inválido.');
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

    it('deve atualizar o e-mail e o telefone', async () => {
      const guest = await createGuest({ name: 'Para Atualizar', group: 'Amigos', status: 'Pendente' });
      const email = `novo_${Date.now()}@email.com`;

      const res = await request(app)
        .patch(`/api/guests/${guest.id}`)
        .set(auth())
        .send({ email, phone: '47999990000' });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(email);
      expect(res.body.phone).toBe('47999990000');
    });

    it('deve aceitar reenviar o próprio e-mail sem acusar duplicidade', async () => {
      const email = `proprio_${Date.now()}@email.com`;
      const guest = await createGuest({ name: 'Mesmo Email', group: 'Amigos', status: 'Pendente', email });

      const res = await request(app).patch(`/api/guests/${guest.id}`).set(auth()).send({ email });

      expect(res.status).toBe(200);
    });

    it('deve retornar 400 ao usar o e-mail de outro convidado', async () => {
      const email = `outro_${Date.now()}@email.com`;
      await createGuest({ name: 'Dono do Email', group: 'Amigos', status: 'Pendente', email });
      const other = await createGuest({ name: 'Outro Convidado', group: 'Amigos', status: 'Pendente' });

      const res = await request(app).patch(`/api/guests/${other.id}`).set(auth()).send({ email });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe outro convidado cadastrado com este e-mail.');
    });

    it('deve retornar 404 para convidado inexistente', async () => {
      const res = await request(app)
        .patch('/api/guests/id-que-nao-existe')
        .set(auth())
        .send({ phone: '47999990000' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Convidado não encontrado.');
    });
  });

  describe('DELETE /api/guests/:id', () => {
    it('deve excluir um convidado existente', async () => {
      const guest = await createGuest({ name: 'Para Excluir', group: 'Amigos', status: 'Pendente' });

      const res = await request(app).delete(`/api/guests/${guest.id}`).set(auth());
      expect(res.status).toBe(204);

      const list = await request(app).get('/api/guests').set(auth());
      expect(list.body.some((g: any) => g.id === guest.id)).toBe(false);
    });

    it('deve retornar 404 para convidado inexistente', async () => {
      const res = await request(app).delete('/api/guests/id-que-nao-existe').set(auth());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Convidado não encontrado.');
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

    it('deve recusar quando o corpo não traz a lista de convidados', async () => {
      const res = await request(app).post('/api/guests/import').set(auth()).send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nenhum convidado fornecido para importação.');
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

    it('deve ignorar convidados duplicados por e-mail', async () => {
      const email = `import_dup_${Date.now()}@email.com`;
      const guest = { name: 'Duplicado Email', group: 'Amigos', status: 'Pendente', email };

      const first = await post([{ ...guest, line: 2 }]);
      expect(first.status).toBe(201);
      expect(first.body.count).toBe(1);

      const second = await post([{ ...guest, line: 2 }]);
      expect(second.status).toBe(201);
      expect(second.body.count).toBe(0);
      expect(second.body.skipped).toBe(1);
      expect(second.body.message).toContain('ignorado(s) por duplicidade');
    });

    it('deve ignorar duplicados por nome e telefone quando não há e-mail', async () => {
      const guest = { name: 'Duplicado Telefone', group: 'Amigos', status: 'Pendente', phone: '47911112222' };

      await post([{ ...guest, line: 2 }]);
      const second = await post([{ ...guest, line: 2 }]);

      expect(second.status).toBe(201);
      expect(second.body.count).toBe(0);
      expect(second.body.skipped).toBe(1);
    });

    it('deve ignorar duplicados dentro da própria planilha e resumir a lista com reticências', async () => {
      const guests = Array.from({ length: 5 }, (_, i) => ({
        line: i + 2,
        name: 'Repetido na Planilha',
        group: 'Amigos',
        status: 'Pendente',
        email: `repetido_${Date.now()}@email.com`,
      }));

      const res = await post(guests);

      expect(res.status).toBe(201);
      expect(res.body.count).toBe(1);
      expect(res.body.skipped).toBe(4);
      expect(res.body.message).toContain('...');
    });
  });
});