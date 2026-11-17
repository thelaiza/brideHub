import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import readXlsxFile from 'read-excel-file'
import { ImportGuestsDialog } from '../components/dialogs/ImportGuestsDialog'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

vi.mock('read-excel-file', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(async () => [
    ['nome', 'grupo', 'status', 'email', 'telefone'],
    ['Maria Exemplo', 'Família da noiva', 'Pendente', 'maria@email.com', '(47) 99999-0000'],
  ]),
}))

describe('ImportGuestsDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnImportSuccess = vi.fn()

  const renderDialog = () =>
    render(
      <ImportGuestsDialog isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    )

  const selectFile = (file: File) => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()
    fireEvent.change(fileInput, { target: { files: [file] } })
  }

  const validCsv = 'nome;grupo;status;email;telefone\nJoão Silva;Amigos;Confirmado;joao@email.com;47999998888'

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
    renderDialog()

    expect(screen.getByText('Importar Convidados')).toBeInTheDocument()
    expect(screen.getByText(/Envie uma planilha CSV ou Excel/i)).toBeInTheDocument()
    expect(screen.getByText('Baixar modelo de planilha CSV')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Selecionar arquivo/i })).toBeInTheDocument()
  })

  it('deve fechar o modal ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve disparar o download do template ao clicar no link correspondente', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByText('Baixar modelo de planilha CSV'))

    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('deve importar um arquivo CSV válido com sucesso', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: '1 convidado(s) importado(s) com sucesso.' },
    })

    renderDialog()
    selectFile(new File([validCsv], 'convidados.csv', { type: 'text/csv' }))

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
    renderDialog()

    const csvContent = 'nome;grupo;status;email;telefone\n;Amigos;Confirmado;joao@email.com;47999998888'
    selectFile(new File([csvContent], 'invalido.csv', { type: 'text/csv' }))

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

    renderDialog()
    selectFile(new File([validCsv], 'convidados.csv', { type: 'text/csv' }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro interno ao processar lote.')
    })
  })

  it('deve importar uma planilha Excel (.xlsx)', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: '1 convidado(s) importado(s) com sucesso.' },
    })
    renderDialog()

    const excelHeaderBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])

    selectFile(
      new File([excelHeaderBytes], 'convidados.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    )

    await waitFor(() => {
      expect(readXlsxFile).toHaveBeenCalled()
      expect(api.post).toHaveBeenCalledWith('/api/guests/import', {
        guests: [
          expect.objectContaining({
            name: 'Maria Exemplo',
            group: 'Família da noiva',
            status: 'Pendente',
            line: 2,
          }),
        ],
      })
      expect(mockOnImportSuccess).toHaveBeenCalledWith('1 convidado(s) importado(s) com sucesso.')
    })
  })

  it('deve alertar quando a leitura do Excel falha', async () => {
    vi.mocked(readXlsxFile).mockRejectedValueOnce(new Error('arquivo corrompido'))
    renderDialog()

    const excelHeaderBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])

    selectFile(
      new File([excelHeaderBytes], 'quebrado.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    )

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(api.post).not.toHaveBeenCalled()
  })

  it('deve alertar quando o arquivo só tem o cabeçalho', async () => {
    renderDialog()

    selectFile(new File(['nome;grupo;status;email;telefone'], 'so-cabecalho.csv', { type: 'text/csv' }))

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(api.post).not.toHaveBeenCalled()
  })

  it('deve alertar quando faltam colunas obrigatórias no cabeçalho', async () => {
    renderDialog()

    selectFile(new File(['nome;email\nAna;ana@email.com'], 'sem-colunas.csv', { type: 'text/csv' }))

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(api.post).not.toHaveBeenCalled()
  })

  it('não deve fazer nada quando nenhum arquivo é selecionado', () => {
    renderDialog()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(api.post).not.toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalled()
  })

  it('deve alertar quando a API falha sem resposta (erro de rede)', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'))
    renderDialog()

    selectFile(new File([validCsv], 'convidados.csv', { type: 'text/csv' }))

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('deve alertar quando a API retorna erro sem mensagem', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { data: {} } })
    renderDialog()

    selectFile(new File([validCsv], 'convidados.csv', { type: 'text/csv' }))

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('deve acionar o seletor de arquivo ao clicar em Selecionar arquivo', async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')
    renderDialog()

    await user.click(screen.getByRole('button', { name: /Selecionar arquivo/i }))

    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})