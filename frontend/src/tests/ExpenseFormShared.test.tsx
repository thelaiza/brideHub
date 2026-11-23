import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ExpenseDialogShell,
  ExpenseFormFields,
  EMPTY_EXPENSE_FORM,
  useExpenseFormOptions,
  type ExpenseFormValues,
} from '../components/dialogs/ExpenseFormShared'
import { api } from '../services/api'
import type { Vendor } from '../types'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

const HookHarness: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const { categories, vendors } = useExpenseFormOptions(isOpen)
  return (
    <div>
      <span data-testid="cats">{categories.join(',')}</span>
      <span data-testid="vendors">{vendors.map((v) => v.name).join(',')}</span>
    </div>
  )
}

describe('ExpenseFormShared', () => {
  const vendors: Vendor[] = [
    { id: 'v-1', name: 'Buffet Imperial', category: 'Buffet', phone: '', status: 'Contratado', cost: 10000 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/categories') return Promise.resolve({ data: ['Buffet', 'Decoracao'] })
      if (url === '/api/vendors') return Promise.resolve({ data: vendors })
      return Promise.resolve({ data: [] })
    })
  })

  it('não deve buscar opções quando isOpen for falso e deve buscar quando for verdadeiro', async () => {
    const { rerender } = render(<HookHarness isOpen={false} />)
    expect(api.get).not.toHaveBeenCalled()

    rerender(<HookHarness isOpen={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('cats')).toHaveTextContent('Buffet,Decoracao')
      expect(screen.getByTestId('vendors')).toHaveTextContent('Buffet Imperial')
    })
  })

  it('deve renderizar shell com loading, campos e propagar alterações e submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn((e) => e.preventDefault())
    const onChange = vi.fn()

    const values: ExpenseFormValues = {
      ...EMPTY_EXPENSE_FORM,
      title: 'Bolo',
      category: 'Buffet',
      amount: '1200',
      dueDate: '2026-10-04',
      status: 'Pago',
    }

    const { rerender } = render(
      <ExpenseDialogShell
        title="Teste Modal"
        submitLabel="Confirmar"
        loading={true}
        onClose={onClose}
        onSubmit={onSubmit}
      >
        <ExpenseFormFields
          idPrefix="test-exp"
          values={values}
          categories={['Buffet', 'Decoracao']}
          vendors={vendors}
          onChange={onChange}
          dueDateRequired
        />
      </ExpenseDialogShell>
    )

    const submitBtn = screen.getByRole('button', { name: 'Salvando...' })
    expect(submitBtn).toBeDisabled()

    rerender(
      <ExpenseDialogShell
        title="Teste Modal"
        submitLabel="Confirmar"
        loading={false}
        onClose={onClose}
        onSubmit={onSubmit}
      >
        <ExpenseFormFields
          idPrefix="test-exp"
          values={values}
          categories={['Buffet', 'Decoracao']}
          vendors={vendors}
          onChange={onChange}
          dueDateRequired
        />
      </ExpenseDialogShell>
    )

    await user.type(screen.getByLabelText('Descrição'), ' Extra')
    expect(onChange).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})