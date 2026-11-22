import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MesasPage } from '../pages/MesasPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGuests = [
  { id: 'g-1', name: 'Ana Paula Silva', group: 'Família da noiva', status: 'Confirmado', table: null, tableId: null },
  { id: 'g-2', name: 'Lucas Ferreira', group: 'Amigos', status: 'Pendente', table: null, tableId: null },
]

describe('MesasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('deve exibir estado inicial vazio quando não há mesas cadastradas', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: mockGuests })

    render(<MesasPage />)

    expect(await screen.findByText('Comece o mapa de mesas')).toBeInTheDocument()
    expect(screen.getByText('Convidados sem mesa')).toBeInTheDocument()
    expect(screen.getByText('Ana Paula Silva')).toBeInTheDocument()
    expect(screen.getByText('Lucas Ferreira')).toBeInTheDocument()
  })

  it('deve criar uma nova mesa pelo modal e exibir o card criado', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: mockGuests })
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 't-1', name: 'Mesa 1', guests: [] },
    })

    render(<MesasPage />)
    await screen.findByText('Comece o mapa de mesas')

    await user.click(screen.getByRole('button', { name: /Criar primeira mesa/i }))
    await user.click(screen.getByRole('button', { name: 'Criar mesa' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/tables', { name: 'Mesa 1' })
      expect(screen.getByText('Mesa 1')).toBeInTheDocument()
      expect(screen.getByText('Mesa vazia')).toBeInTheDocument()
    })
  })

  it('deve adicionar um convidado na mesa, atualizar contadores e remover da mesa depois', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 't-1', name: 'Mesa 1', guests: [] }] })
      .mockResolvedValueOnce({ data: mockGuests })

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { ...mockGuests[0], table: 'Mesa 1', tableId: 't-1' },
    })

    vi.mocked(api.delete).mockResolvedValueOnce({
      data: { ...mockGuests[0], table: null, tableId: null },
    })

    render(<MesasPage />)
    await screen.findByText('Mesa 1')

    await user.click(screen.getByRole('button', { name: /Adicionar convidado/i }))
    await user.selectOptions(screen.getByLabelText('Convidado'), 'g-1')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/tables/t-1/guests', { guestId: 'g-1' })
      expect(screen.getByText('1 convidado')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Remover Ana Paula Silva da Mesa 1' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/tables/t-1/guests/g-1')
      expect(screen.getByText('0 convidados')).toBeInTheDocument()
    })
  })

  it('deve excluir uma mesa quando confirmado', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 't-1', name: 'Mesa 1', guests: [] }] })
      .mockResolvedValueOnce({ data: mockGuests })
    vi.mocked(api.delete).mockResolvedValueOnce({})

    render(<MesasPage />)
    await screen.findByText('Mesa 1')

    await user.click(screen.getByRole('button', { name: 'Excluir mesa' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/tables/t-1')
      expect(screen.queryByText('Mesa 1')).not.toBeInTheDocument()
    })
  })

  it('não deve excluir a mesa quando o usuário cancelar a confirmação', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 't-1', name: 'Mesa 1', guests: [] }] })
      .mockResolvedValueOnce({ data: mockGuests })

    render(<MesasPage />)
    await screen.findByText('Mesa 1')

    await user.click(screen.getByRole('button', { name: 'Excluir mesa' }))

    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
  })

  it('deve exibir alerta quando ocorrer erro ao excluir mesa ou remover convidado', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            id: 't-1',
            name: 'Mesa 1',
            guests: [{ ...mockGuests[0], table: 'Mesa 1', tableId: 't-1' }],
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [{ ...mockGuests[0], table: 'Mesa 1', tableId: 't-1' }, mockGuests[1]],
      })

    vi.mocked(api.delete).mockRejectedValueOnce({
      response: { data: { error: 'Erro ao remover convidado da mesa.' } },
    })

    render(<MesasPage />)
    await screen.findByText('Mesa 1')

    await user.click(screen.getByRole('button', { name: 'Remover Ana Paula Silva da Mesa 1' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao remover convidado da mesa.')
  })
})