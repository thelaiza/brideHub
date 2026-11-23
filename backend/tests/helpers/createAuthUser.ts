import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/server.js';

export async function createAuthUser() {
  const uniqueEmail = `testuser_${Date.now()}_${randomUUID().slice(0, 8)}@bridehub.com`;

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Usuário Teste Helper',
      email: uniqueEmail,
      password: 'password123',
    });

  const userId = registerResponse.body.id;

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: uniqueEmail,
      password: 'password123',
    });

  const authToken = loginResponse.body.token;

  return { userId, authToken, uniqueEmail };
}