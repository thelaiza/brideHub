/// <reference types="jest" />

import { jest } from '@jest/globals';
import {
  getGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  importGuests,
} from '../src/controllers/guestController.js';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('guestController (unitário)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['getGuests', getGuests],
    ['createGuest', createGuest],
    ['updateGuest', updateGuest],
    ['deleteGuest', deleteGuest],
    ['importGuests', importGuests],
  ])('%s deve retornar 401 quando req.userId não existir', async (_name, handler) => {
    const res = mockRes();
    await handler({ params: { id: '1' }, body: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('getGuests deve retornar 500 quando a consulta falhar', async () => {
    const res = mockRes();
    await getGuests({ userId: 123 } as any, res); // tipo inválido: o Prisma rejeita
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('createGuest deve retornar 500 em erro inesperado', async () => {
    const res = mockRes();
    await createGuest({ userId: 'u1' } as any, res); // sem body
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('updateGuest deve retornar 500 em erro inesperado', async () => {
    const res = mockRes();
    await updateGuest({ userId: 'u1' } as any, res); // sem params
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('deleteGuest deve retornar 500 em erro inesperado', async () => {
    const res = mockRes();
    await deleteGuest({ userId: 'u1' } as any, res); // sem params
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('importGuests deve retornar 500 quando o banco falhar', async () => {
    const res = mockRes();
    await importGuests(
      {
        userId: 'usuario-inexistente', // viola a chave estrangeira no createMany
        body: { guests: [{ name: 'Ana', group: 'Amigos', status: 'Pendente' }] },
      } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});