import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewVendorDialog } from '../components/dialogs/NewVendorDialog'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('NewVendorDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: ['Buffet', 'Cerimonial'] })
  })

  it('não deve renderizar nada quando isOpen for falso', () => {
    const { container } = render(
      <NewVendorDialog 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(container).toBeEmptyDOMElement()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('deve renderizar o formulário e carregar as categorias quando isOpen for verdadeiro', async () => {
    render(
      <NewVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Boulevard Eventos')).toBeInTheDocument()

    expect(await screen.findByRole('option', { name: 'Buffet' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/categories')
    expect(screen.getByLabelText('Categoria')).toHaveValue('Buffet')
  })

  it('deve chamar onClose ao clicar no botão de cancelar', async () => {
    const user = userEvent.setup()

    render(
      <NewVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Buffet' })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onSave com os dados preenchidos e fechar o modal ao submeter', async () => {
    const user = userEvent.setup()

    render(
      <NewVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Cerimonial' })

    await user.type(screen.getByPlaceholderText('Ex: Boulevard Eventos'), 'Cerimonial Laços de Amor')
    await user.selectOptions(screen.getByLabelText('Categoria'), 'Cerimonial')
    await user.type(screen.getByPlaceholderText('0,00'), '4000')
    await user.type(screen.getByPlaceholderText('(47) 99999-9999'), '(47) 98888-8888')
    await user.type(screen.getByPlaceholderText('contato@fornecedor.com'), 'contato@lacosdeamor.com')

    await user.click(screen.getByRole('button', { name: /salvar fornecedor/i }))

    expect(mockOnSave).toHaveBeenCalledTimes(1)
    expect(mockOnSave).toHaveBeenCalledWith({
      name: 'Cerimonial Laços de Amor',
      category: 'Cerimonial',
      phone: '(47) 98888-8888',
      email: 'contato@lacosdeamor.com',
      cost: 4000,
      status: 'Orçamento',
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})