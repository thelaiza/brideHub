import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditVendorDialog } from '../components/dialogs/EditVendorDialog'
import { api } from '../services/api'
import type { Vendor } from '../types'

vi.mock('../services/api', () => ({
  api: {
    patch: vi.fn(),
  },
}))

describe('EditVendorDialog Component', () => {
  const mockVendor: Vendor = {
    id: '1',
    name: 'Buffet Master',
    category: 'Buffet',
    phone: '47999999999',
    email: 'contato@buffetmaster.com',
    cost: 12000,
    status: 'Contratado',
  }

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar nada quando isOpen for falso', () => {
    render(
      <EditVendorDialog 
        isOpen={false} 
        onClose={mockOnClose} 
        vendor={mockVendor} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.queryByText('Editar Fornecedor')).not.toBeInTheDocument()
  })

  it('deve preencher os campos com os dados do fornecedor quando isOpen for verdadeiro', () => {
    render(
      <EditVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        vendor={mockVendor} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Editar Fornecedor')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Buffet Master')).toBeInTheDocument()
    expect(screen.getByDisplayValue('47999999999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('contato@buffetmaster.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12000')).toBeInTheDocument()
  })

  it('deve chamar onClose ao clicar no botão de cancelar', async () => {
    const user = userEvent.setup()

    render(
      <EditVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        vendor={mockVendor} 
        onSave={mockOnSave} 
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve enviar os dados atualizados via patch e chamar onSave ao submeter o formulário', async () => {
    const user = userEvent.setup()
    const updatedResponse = { ...mockVendor, name: 'Buffet Master Premium' }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: updatedResponse })

    render(
      <EditVendorDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        vendor={mockVendor} 
        onSave={mockOnSave} 
      />
    )

    const nameInput = screen.getByDisplayValue('Buffet Master')
    await user.clear(nameInput)
    await user.type(nameInput, 'Buffet Master Premium')

    const submitButton = screen.getByRole('button', { name: /salvar alterações/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledTimes(1)
      expect(api.patch).toHaveBeenCalledWith('/api/vendors/1', {
        name: 'Buffet Master Premium',
        category: 'Buffet',
        phone: '47999999999',
        email: 'contato@buffetmaster.com',
        cost: 12000,
        status: 'Contratado',
      })
      expect(mockOnSave).toHaveBeenCalledWith(updatedResponse)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})