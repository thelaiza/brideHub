import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportGuestsDialog } from '../components/dialogs/ImportGuestsDialog'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

vi.mock('read-excel-file', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue([
    ['nome', 'grupo', 'status', 'email', 'telefone'],
    ['Maria Exemplo', 'Família da noiva', 'Pendente', 'maria@email.com', '(47) 99999-0000'],
  ]),
}))

describe('ImportGuestsDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnImportSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()

    if (typeof window !== 'undefined' && window.URL) {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url') as unknown as typeof window.URL.createObjectURL
      window.URL.revokeObjectURL = vi.fn()
    }
  })

  it('não deve renderizar nada se isOpen for falso', () => {
    const { container } = render(
      <ImportGuestsDialog isOpen={false} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar o modal corretamente quando isOpen for verdadeiro', () => {
    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

    expect(screen.getByText('Importar Convidados')).toBeInTheDocument()
    expect(screen.getByText(/Envie uma planilha CSV ou Excel/i)).toBeInTheDocument()
    expect(screen.getByText('Baixar modelo de planilha CSV')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Selecionar arquivo/i })).toBeInTheDocument()
  })

  it('deve fechar o modal ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve disparar o download do template ao clicar no link correspondente', async () => {
    const user = userEvent.setup()
    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

    const downloadLink = screen.getByText('Baixar modelo de planilha CSV')
    await user.click(downloadLink)

    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('deve importar um arquivo CSV válido com sucesso', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: '1 convidado(s) importado(s) com sucesso.' },
    })

    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

    const csvContent = 'nome;grupo;status;email;telefone\nJoão Silva;Amigos;Confirmado;joao@email.com;47999998888'
    const file = new File([csvContent], 'convidados.csv', { type: 'text/csv' })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/guests/import', {
        guests: [
          {
            email: 'joao@email.com',
            group: 'Amigos',
            line: 2,
            name: 'João Silva',
            phone: '47999998888',
            status: 'Confirmado',
          },
        ],
      })
      expect(mockOnImportSuccess).toHaveBeenCalledWith('1 convidado(s) importado(s) com sucesso.')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('deve exibir alerta de erro de validação se a planilha contiver campos obrigatórios ausentes', async () => {
    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

    const csvContent = 'nome;grupo;status;email;telefone\n;Amigos;Confirmado;joao@email.com;47999998888'
    const file = new File([csvContent], 'invalido.csv', { type: 'text/csv' })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Importação recusada. Corrija a planilha')
      )
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  it('deve tratar erros retornados pela API durante a importação', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { error: 'Erro interno ao processar lote.' } },
    })

    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

    const csvContent = 'nome;grupo;status;email;telefone\nJoão Silva;Amigos;Confirmado;joao@email.com;47999998888'
    const file = new File([csvContent], 'convidados.csv', { type: 'text/csv' })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro interno ao processar lote.')
    })
  })
})