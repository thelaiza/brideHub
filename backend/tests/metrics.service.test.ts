import { client, httpRequestsTotal, httpRequestDurationSeconds } from '../src/services/metrics.service.js';

describe('Metrics Service', () => {
  it('should initialize the client and register default metrics', () => {
    expect(client).toBeDefined();
    expect(client.register).toBeDefined();
  });

  it('should create httpRequestsTotal counter', () => {
    expect(httpRequestsTotal).toBeDefined();
    expect(typeof httpRequestsTotal.inc).toBe('function');
  });

  it('should create httpRequestDurationSeconds histogram', () => {
    expect(httpRequestDurationSeconds).toBeDefined();
    expect(typeof httpRequestDurationSeconds.observe).toBe('function');
  });
});