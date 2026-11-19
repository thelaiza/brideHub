/// <reference types="jest" />

import { jest } from '@jest/globals';
import {
  sendPasswordResetEmail,
  sendGoogleAccountEmail,
} from '../src/services/emailService.js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const spyFetch = () => jest.spyOn(globalThis, 'fetch');
const spyConsole = (method: 'warn' | 'log' | 'error') => jest.spyOn(console, method);

describe('emailService', () => {
  const original = {
    key: process.env.RESEND_API_KEY,
    front: process.env.FRONTEND_URL,
    from: process.env.RESEND_FROM,
  };

  let fetchSpy: ReturnType<typeof spyFetch>;
  let warnSpy: ReturnType<typeof spyConsole>;
  let logSpy: ReturnType<typeof spyConsole>;
  let errorSpy: ReturnType<typeof spyConsole>;

  const sentPayload = () => {
    const [, init] = fetchSpy.mock.calls[0] as unknown as [unknown, { body: string }];
    return JSON.parse(init.body);
  };

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    delete process.env.RESEND_FROM;

    fetchSpy = spyFetch().mockImplementation(async () => jsonResponse({ id: 'email_123' }));
    warnSpy = spyConsole('warn').mockImplementation(() => undefined);
    logSpy = spyConsole('log').mockImplementation(() => undefined);
    errorSpy = spyConsole('error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    const restore = (name: string, value: string | undefined) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    };
    restore('RESEND_API_KEY', original.key);
    restore('FRONTEND_URL', original.front);
    restore('RESEND_FROM', original.from);
  });

  describe('sendPasswordResetEmail', () => {
    it('deve apenas avisar no log quando RESEND_API_KEY não está configurada', async () => {
      delete process.env.RESEND_API_KEY;

      await expect(
        sendPasswordResetEmail('noiva@email.com', 'Laíza', 'token123'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/redefinir-senha?token=token123'),
      );
    });

    it('deve enviar o e-mail com destinatário, assunto e link de redefinição', async () => {
      await sendPasswordResetEmail('noiva@email.com', 'Laíza', 'token123');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const payload = sentPayload();
      expect(payload.to).toBe('noiva@email.com');
      expect(payload.from).toBe('BrideHub <onboarding@resend.dev>');
      expect(payload.subject).toBe('Redefinição de senha - BrideHub');
      expect(payload.html).toContain('http://localhost:5173/redefinir-senha?token=token123');
      expect(payload.html).toContain('Laíza');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('email_123'));
    });

    it('deve usar o remetente definido em RESEND_FROM', async () => {
      process.env.RESEND_FROM = 'BrideHub <contato@bridehub.com>';

      await sendPasswordResetEmail('noiva@email.com', 'Laíza', 'token123');

      expect(sentPayload().from).toBe('BrideHub <contato@bridehub.com>');
    });

    it('deve remover a barra final de FRONTEND_URL', async () => {
      process.env.FRONTEND_URL = 'https://bridehub.com/';

      await sendPasswordResetEmail('noiva@email.com', 'Laíza', 'abc');

      expect(sentPayload().html).toContain('https://bridehub.com/redefinir-senha?token=abc');
    });

    it('deve usar localhost como padrão quando FRONTEND_URL não existe', async () => {
      delete process.env.FRONTEND_URL;

      await sendPasswordResetEmail('noiva@email.com', 'Laíza', 'abc');

      expect(sentPayload().html).toContain('http://localhost:5173/redefinir-senha?token=abc');
    });

    it('deve escapar HTML no nome do usuário', async () => {
      await sendPasswordResetEmail('noiva@email.com', '<script>alert("x")</script>', 'abc');

      const { html } = sentPayload();
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('deve lançar erro quando o Resend rejeita o envio', async () => {
      fetchSpy.mockImplementation(async () =>
        jsonResponse({ name: 'validation_error', message: 'Invalid', statusCode: 422 }, 422),
      );

      await expect(
        sendPasswordResetEmail('noiva@email.com', 'Laíza', 'abc'),
      ).rejects.toThrow('Falha ao enviar o e-mail de redefinição.');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('sendGoogleAccountEmail', () => {
    it('deve apenas avisar no log quando RESEND_API_KEY não está configurada', async () => {
      delete process.env.RESEND_API_KEY;

      await expect(
        sendGoogleAccountEmail('noiva@email.com', 'Laíza'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('deve enviar o aviso de conta Google', async () => {
      await sendGoogleAccountEmail('noiva@email.com', 'Laíza');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const payload = sentPayload();
      expect(payload.to).toBe('noiva@email.com');
      expect(payload.subject).toBe('Sua conta BrideHub usa o login do Google');
      expect(payload.html).toContain('login do Google');
      expect(payload.html).toContain('http://localhost:5173');
    });

    it('deve usar o remetente definido em RESEND_FROM e escapar o nome', async () => {
      process.env.RESEND_FROM = 'BrideHub <contato@bridehub.com>';

      await sendGoogleAccountEmail('noiva@email.com', '<b>Laíza</b>');

      const payload = sentPayload();
      expect(payload.from).toBe('BrideHub <contato@bridehub.com>');
      expect(payload.html).not.toContain('<b>Laíza</b>');
      expect(payload.html).toContain('&lt;b&gt;Laíza&lt;/b&gt;');
    });

    it('deve lançar erro quando o Resend rejeita o envio', async () => {
      fetchSpy.mockImplementation(async () =>
        jsonResponse({ name: 'validation_error', message: 'Invalid', statusCode: 422 }, 422),
      );

      await expect(
        sendGoogleAccountEmail('noiva@email.com', 'Laíza'),
      ).rejects.toThrow('Falha ao enviar o aviso de conta Google.');
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});