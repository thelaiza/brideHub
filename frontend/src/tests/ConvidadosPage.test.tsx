import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConvidadosPage } from '../pages/ConvidadosPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../components/dialogs/NewGuestDialog', () => ({
  NewGuestDialog: ({ isOpen, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="new-guest-dialog">
        <button
          onClick={() =>
            onSave({ name: 'Novo Convidado Teste', group: 'Amigos', status: 'Pendente', email: 'novo@email.com', phone: '47999990000' })
          }
        >
          Salvar Novo
        </button>
        <button onClick={onClose}>Fechar Novo</button>
      </div>
    ) : null,
}))

vi.mock('../components/dialogs/EditGuestDialog', () => ({
  EditGuestDialog: ({ isOpen }: any) => (isOpen ? <div data-testid="edit-guest-dialog">Editando</div> : null),
}))

vi.mock('../components/dialogs/ImportGuestsDialog', () => ({
  ImportGuestsDialog: ({ isOpen, onClose, onImportSuccess }: any) =>
    isOpen ? (
      <div data-testid="import-guest-dialog">
        <button onClick={() => onImportSuccess('2 convidados importados com sucesso.')}>Simular Importação</button>
        <button onClick={onClose}>Fechar Importação</button>
      </div>
    ) : null,
}))

describe('ConvidadosPage Component', () => {
  const mockGuests = [
    { id: '1', name: 'João Silva', group: 'Família da noiva', status: 'Confirmado', email: 'joao@email.com', phone: '47988887777' },
    { id: '2', name: 'Maria Souza', group: 'Amigos', status: 'Pendente', email: 'maria@email.com', phone: '47977776666' },
    { id: '3', name: 'Carlos Lima', group: 'Padrinhos', status: 'Negado', email: '', phone: '' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: mockGuests })
  })

  it('deve carregar e exibir a lista de convidados corretamente', async () => {
    render(<ConvidadosPage />)

    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('Carlos Lima')).toBeInTheDocument()
    expect(screen.getAllByText('Família da noiva').length).toBeGreaterThan(0)
    expect(screen.getByText('joao@email.com')).toBeInTheDocument()
  })

  it('deve filtrar convidados pelo campo de busca', async () => {
    const user = userEvent.setup()
    render(<ConvidadosPage />)

    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Maria Souza')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Buscar por nome, e-mail, telefone.../i)
    await user.type(searchInput, 'Maria')

    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
  })

  it('deve filtrar convidados por grupo ao clicar nos botões de filtro', async () => {
    const user = userEvent.setup()
    render(<ConvidadosPage />)

    expect(await screen.findByText('João Silva')).toBeInTheDocument()

    const groupButton = screen.getByRole('button', { name: /Amigos/i })
    await user.click(groupButton)

    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
    expect(screen.queryByText('Carlos Lima')).not.toBeInTheDocument()
  })

  it('deve abrir e fechar o diálogo de Novo Convidado', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: '4', name: 'Novo Convidado Teste', group: 'Amigos', status: 'Pendente', email: 'novo@email.com', phone: '47999990000' },
    })

    render(<ConvidadosPage />)

    expect(await screen.findByText('João Silva')).toBeInTheDocument()

    const newButton = screen.getByRole('button', { name: /Novo Convidado/i })
    await user.click(newButton)

    expect(screen.getByTestId('new-guest-dialog')).toBeInTheDocument()

    const saveButton = screen.getByRole('button', { name: /Salvar Novo/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/guests', expect.any(Object))
      expect(screen.getByText('Novo Convidado Teste')).toBeInTheDocument()
    })
  })

  it('deve alterar rapidamente o status (RSVP) de um convidado', async () => {
    const user = userEvent.setup()
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: { ...mockGuests[1], status: 'Confirmado' },
    })

    render(<ConvidadosPage />)

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument()

    const confirmButtons = screen.getAllByTitle('Confirmado')
    await user.click(confirmButtons[1])

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/guests/2', { status: 'Confirmado' })
    })
  })

  it('deve excluir um convidado ao confirmar', async () => {
    const user = userEvent.setup()
    vi.mocked(api.delete).mockResolvedValueOnce({})
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

    render(<ConvidadosPage />)

    expect(await screen.findByText('João Silva')).toBeInTheDocument()

    const deleteButtons = screen.getAllByTitle('Remover convidado')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/guests/1')
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
    })
  })

  it('deve lidar com o sucesso da importação de planilha', async () => {
    const user = userEvent.setup()
    render(<ConvidadosPage />)

    expect(await screen.findByText('João Silva')).toBeInTheDocument()

    const importButton = screen.getByRole('button', { name: /Importar planilha/i })
    await user.click(importButton)

    expect(screen.getByTestId('import-guest-dialog')).toBeInTheDocument()

    const simulateImportButton = screen.getByRole('button', { name: /Simular Importação/i })
    await user.click(simulateImportButton)

    await waitFor(() => {
      expect(screen.getByText('2 convidados importados com sucesso.')).toBeInTheDocument()
    })
  })
})