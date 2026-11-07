import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AppShell } from '../components/common/AppShell' 

describe('AppShell Component', () => {
  it('deve renderizar os elementos estruturais principais corretamente', () => {
    const mockOnTabChange = vi.fn()
    const mockOnLogout = vi.fn()

    render(
      <AppShell 
        currentTab="dashboard" 
        onTabChange={mockOnTabChange} 
        onLogout={mockOnLogout}
      >
        <div data-testid="child-content">Conteúdo de Teste</div>
      </AppShell>
    )

    const childElement = screen.getByTestId('child-content')
    expect(childElement).toBeInTheDocument()
    expect(childElement).toHaveTextContent('Conteúdo de Teste')
  })
})