import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditVendorDialog } from '../components/dialogs/EditVendorDialog'
import { api } from '../services/api'
import type { Vendor } from '../types'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
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

  const mockCategories = ['Buffet', 'Fotografia e Vídeo']

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: mockCategories })
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
    expect(api.get).not.toHaveBeenCalled()
  })

  it('deve preencher os campos com os dados do fornecedor quando isOpen for verdadeiro', async () => {
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

    await screen.findByRole('option', { name: 'Fotografia e Vídeo' })
    expect(screen.getByLabelText('Categoria')).toHaveValue('Buffet')
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

    await screen.findByRole('option', { name: 'Fotografia e Vídeo' })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

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

    await screen.findByRole('option', { name: 'Fotografia e Vídeo' })

    const nameInput = screen.getByDisplayValue('Buffet Master')
    await user.clear(nameInput)
    await user.type(nameInput, 'Buffet Master Premium')

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

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