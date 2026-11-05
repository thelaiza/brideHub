import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FornecedoresPage } from '../pages/FornecedoresPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('FornecedoresPage Component', () => {
  const mockVendors = [
    { id: '1', name: 'Buffet Master', category: 'Buffet', phone: '47999999999', email: 'contato@buffet.com', cost: 12000, status: 'Contratado' },
    { id: '2', name: 'Foto Bella', category: 'Fotografia e Vídeo', phone: '47988888888', email: 'contato@foto.com', cost: 5000, status: 'Orçamento' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve carregar e exibir a lista de fornecedores corretamente', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVendors })

    render(<FornecedoresPage />)

    expect(await screen.findByText('Buffet Master')).toBeInTheDocument()
    expect(screen.getByText('Foto Bella')).toBeInTheDocument()
    expect(screen.getByText('R$ 12.000,00')).toBeInTheDocument()
  })

  it('deve filtrar fornecedores pelo campo de busca', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVendors })

    render(<FornecedoresPage />)

    expect(await screen.findByText('Buffet Master')).toBeInTheDocument()
    expect(screen.getByText('Foto Bella')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/buscar por nome do fornecedor ou categoria/i)
    await user.type(searchInput, 'Buffet')

    expect(screen.getByText('Buffet Master')).toBeInTheDocument()
    expect(screen.queryByText('Foto Bella')).not.toBeInTheDocument()
  })

  it('deve excluir um fornecedor ao confirmar', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVendors })
    vi.mocked(api.delete).mockResolvedValueOnce({})
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

    render(<FornecedoresPage />)

    expect(await screen.findByText('Buffet Master')).toBeInTheDocument()

    const deleteButtons = screen.getAllByTitle('Excluir fornecedor')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/vendors/1')
      expect(screen.queryByText('Buffet Master')).not.toBeInTheDocument()
    })
  })
})