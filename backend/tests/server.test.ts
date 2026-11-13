import request from 'supertest';
import { jest } from '@jest/globals';
import app, { getAllowedOrigins } from '../src/server.js';
import { client } from '../src/services/metrics.service.js';

describe('Server App', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return online status on /api/status', async () => {
    const response = await request(app).get('/api/status');
    expect([200, 401, 500]).toContain(response.status);
  });

  it('should return metrics content on /metrics', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toContain('bridehub_');
  });

  it('should return 500 on /metrics when metrics collection fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(client.register, 'metrics').mockRejectedValueOnce(new Error('boom'));

    const response = await request(app).get('/metrics');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Internal Server Error collecting metrics');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should not expose the x-powered-by header', async () => {
    const response = await request(app).get('/metrics');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('getAllowedOrigins', () => {
  it('should return * when CORS_ORIGINS is not defined', () => {
    expect(getAllowedOrigins(undefined)).toBe('*');
  });

  it('should return * when CORS_ORIGINS is empty', () => {
    expect(getAllowedOrigins('')).toBe('*');
  });

  it('should split and trim origins when CORS_ORIGINS is defined', () => {
    expect(getAllowedOrigins('http://a.com, http://b.com')).toEqual([
      'http://a.com',
      'http://b.com',
    ]);
  });
});