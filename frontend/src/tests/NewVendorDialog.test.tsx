import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewVendorDialog } from '../components/dialogs/NewVendorDialog'

describe('NewVendorDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  it('deve renderizar o formulário corretamente quando isOpen for verdadeiro', () => {
    render(
      <NewVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Boulevard Eventos')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Buffet')).toBeInTheDocument()
  })

  it('deve chamar onClose ao clicar no botão de cancelar ou fechar', async () => {
    const user = userEvent.setup()

    render(
      <NewVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

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

    const nameInput = screen.getByPlaceholderText('Ex: Boulevard Eventos')
    const categoryInput = screen.getByPlaceholderText('Ex: Buffet')
    const costInput = screen.getByPlaceholderText('0,00')
    const phoneInput = screen.getByPlaceholderText('(47) 99999-9999')
    const emailInput = screen.getByPlaceholderText('contato@fornecedor.com')

    await user.type(nameInput, 'Cerimonial Laços de Amor')
    await user.clear(categoryInput)
    await user.type(categoryInput, 'Cerimonial')
    await user.type(costInput, '4000')
    await user.type(phoneInput, '(47) 98888-8888')
    await user.type(emailInput, 'contato@lacosdeamor.com')

    const submitButton = screen.getByRole('button', { name: /salvar fornecedor/i })
    await user.click(submitButton)

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