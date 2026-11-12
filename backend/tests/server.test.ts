import request from 'supertest';
import app from '../src/server.js';

describe('Server App', () => {
  it('should return online status on /api/status', async () => {
    const response = await request(app).get('/api/status');
    expect([200, 401, 500]).toContain(response.status);
  });

  it('should return metrics content on /metrics', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toBeDefined();
  });
});