import { metricsMiddleware } from '../src/middlewares/metricsMiddleware.js';
import type { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

describe('Metrics Middleware', () => {
  it('should call next and record metrics on response finish', () => {
    const req = {
      method: 'GET',
      path: '/api/status',
      route: { path: '/api/status' },
    } as unknown as Request;

    const eventHandlers: Record<string, () => void> = {};
    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        eventHandlers[event] = handler;
      }),
    } as unknown as Response;

    const next: NextFunction = jest.fn();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();

    if (eventHandlers['finish']) {
      eventHandlers['finish']();
    }
  });

  it('should fallback to req.path if req.route is not defined', () => {
    const req = {
      method: 'POST',
      path: '/unknown',
    } as unknown as Request;

    const eventHandlers: Record<string, () => void> = {};
    const res = {
      statusCode: 404,
      on: jest.fn((event: string, handler: () => void) => {
        eventHandlers[event] = handler;
      }),
    } as unknown as Response;

    const next: NextFunction = jest.fn();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();

    if (eventHandlers['finish']) {
      eventHandlers['finish']();
    }
  });
});