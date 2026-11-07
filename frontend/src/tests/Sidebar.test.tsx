import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Sidebar } from '../components/common/Sidebar'

describe('Sidebar Component', () => {
  it('deve renderizar todos os itens de menu e o botão de sair corretamente', () => {
    const mockOnTabChange = vi.fn()
    const mockOnLogout = vi.fn()

    render(
      <Sidebar 
        currentTab="dashboard" 
        onTabChange={mockOnTabChange} 
        onLogout={mockOnLogout} 
      />
    )

    expect(screen.getByText('BrideHub')).toBeInTheDocument()
    expect(screen.getByText('Planejamento Inteligente')).toBeInTheDocument()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Fornecedores')).toBeInTheDocument()
    expect(screen.getByText('Tarefas')).toBeInTheDocument()
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('deve chamar onTabChange com o ID correto ao clicar em um item do menu', async () => {
    const user = userEvent.setup()
    const mockOnTabChange = vi.fn()
    const mockOnLogout = vi.fn()

    render(
      <Sidebar 
        currentTab="dashboard" 
        onTabChange={mockOnTabChange} 
        onLogout={mockOnLogout} 
      />
    )

    const financeiroButton = screen.getByText('Financeiro')
    await user.click(financeiroButton)

    expect(mockOnTabChange).toHaveBeenCalledTimes(1)
    expect(mockOnTabChange).toHaveBeenCalledWith('financeiro')
  })

  it('deve chamar onLogout ao clicar no botão de sair', async () => {
    const user = userEvent.setup()
    const mockOnTabChange = vi.fn()
    const mockOnLogout = vi.fn()

    render(
      <Sidebar 
        currentTab="dashboard" 
        onTabChange={mockOnTabChange} 
        onLogout={mockOnLogout} 
      />
    )

    const logoutButton = screen.getByText('Sair')
    await user.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalledTimes(1)
  })

  it('deve destacar visualmente a aba que está ativa', () => {
    const mockOnTabChange = vi.fn()
    const mockOnLogout = vi.fn()

    render(
      <Sidebar 
        currentTab="tarefas" 
        onTabChange={mockOnTabChange} 
        onLogout={mockOnLogout} 
      />
    )

    const tarefasButton = screen.getByText('Tarefas').closest('button')
    expect(tarefasButton).toHaveClass('bg-rose-50 text-rose-600')

    const dashboardButton = screen.getByText('Dashboard').closest('button')
    expect(dashboardButton).not.toHaveClass('bg-rose-50 text-rose-600')
  })
})