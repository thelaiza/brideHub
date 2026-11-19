import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

vi.mock('../services/api', () => ({
  TOKEN_KEY: 'bridehub_token',
}))

vi.mock('../components/common/AppShell', () => ({
  AppShell: ({
    children,
    currentTab,
    onTabChange,
    onLogout,
  }: {
    children: React.ReactNode
    currentTab: string
    onTabChange: (tab: string) => void
    onLogout: () => void
  }) => (
    <div data-testid="app-shell" data-tab={currentTab}>
      {['dashboard', 'financeiro', 'fornecedores', 'tarefas', 'convidados'].map((tab) => (
        <button key={tab} type="button" onClick={() => onTabChange(tab)}>
          {`tab:${tab}`}
        </button>
      ))}
      <button type="button" onClick={onLogout}>
        logout
      </button>
      {children}
    </div>
  ),
}))

vi.mock('../pages/DashboardPage', () => ({
  DashboardPage: ({ onNavigate }: { onNavigate: (tab: string) => void }) => (
    <div data-testid="dashboard-page">
      <button type="button" onClick={() => onNavigate('tarefas')}>
        nav-tarefas
      </button>
    </div>
  ),
}))
vi.mock('../pages/FinanceiroPage', () => ({
  FinanceiroPage: () => <div data-testid="financeiro-page" />,
}))
vi.mock('../pages/FornecedoresPage', () => ({
  FornecedoresPage: () => <div data-testid="fornecedores-page" />,
}))
vi.mock('../pages/TarefasPage', () => ({
  TarefasPage: () => <div data-testid="tarefas-page" />,
}))
vi.mock('../pages/ConvidadosPage', () => ({
  ConvidadosPage: () => <div data-testid="convidados-page" />,
}))

vi.mock('../pages/LoginPage', () => ({
  LoginPage: ({ onLogin }: { onLogin: (token?: string) => void }) => (
    <div data-testid="login-page">
      <button type="button" onClick={() => onLogin('novo-token')}>
        do-login
      </button>
      <button type="button" onClick={() => onLogin()}>
        do-login-sem-token
      </button>
    </div>
  ),
}))

vi.mock('../pages/ResetPasswordPage', () => ({
  ResetPasswordPage: ({
    token,
    onBackToLogin,
  }: {
    token: string
    onBackToLogin: () => void
  }) => (
    <div data-testid="reset-page" data-token={token}>
      <button type="button" onClick={onBackToLogin}>
        back-to-login
      </button>
    </div>
  ),
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
    document.title = ''
  })

  describe('autenticação', () => {
    it('deve exibir a tela de login quando não há token', () => {
      render(<App />)

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
    })

    it('deve exibir o app quando já existe token salvo', () => {
      localStorage.setItem('bridehub_token', 'token-salvo')

      render(<App />)

      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    })

    it('deve salvar o token e entrar no app após o login', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('do-login'))

      expect(localStorage.getItem('bridehub_token')).toBe('novo-token')
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    })

    it('deve entrar no app mesmo quando o login não retorna token', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('do-login-sem-token'))

      expect(localStorage.getItem('bridehub_token')).toBeNull()
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    })

    it('deve limpar token e aba salvos e voltar ao login ao sair', async () => {
      const user = userEvent.setup()
      localStorage.setItem('bridehub_token', 'token-salvo')
      localStorage.setItem('currentTab', 'financeiro')
      render(<App />)

      await user.click(screen.getByText('logout'))

      expect(localStorage.getItem('bridehub_token')).toBeNull()
      expect(localStorage.getItem('currentTab')).toBeNull()
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('navegação entre abas', () => {
    beforeEach(() => {
      localStorage.setItem('bridehub_token', 'token-salvo')
    })

    it('deve iniciar na aba dashboard com o título padrão', () => {
      render(<App />)

      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-tab', 'dashboard')
      expect(document.title).toBe('BrideHub')
    })

    it('deve restaurar a aba salva no localStorage', () => {
      localStorage.setItem('currentTab', 'financeiro')

      render(<App />)

      expect(screen.getByTestId('financeiro-page')).toBeInTheDocument()
      expect(document.title).toBe('Financeiro — BrideHub')
    })

    it.each([
      ['dashboard', 'dashboard-page', 'BrideHub'],
      ['financeiro', 'financeiro-page', 'Financeiro — BrideHub'],
      ['fornecedores', 'fornecedores-page', 'Fornecedores — BrideHub'],
      ['tarefas', 'tarefas-page', 'Tarefas — BrideHub'],
      ['convidados', 'convidados-page', 'Convidados — BrideHub'],
    ])('deve abrir a aba %s, salvar a escolha e atualizar o título', async (tab, testId, title) => {
      const user = userEvent.setup()
      localStorage.setItem('currentTab', tab === 'dashboard' ? 'financeiro' : 'dashboard')
      render(<App />)

      await user.click(screen.getByText(`tab:${tab}`))

      expect(screen.getByTestId(testId)).toBeInTheDocument()
      expect(localStorage.getItem('currentTab')).toBe(tab)
      expect(document.title).toBe(title)
    })

    it('deve navegar para outra aba pelo onNavigate do dashboard', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('nav-tarefas'))

      expect(screen.getByTestId('tarefas-page')).toBeInTheDocument()
      expect(localStorage.getItem('currentTab')).toBe('tarefas')
    })

    it('deve usar o título padrão para uma aba desconhecida', () => {
      localStorage.setItem('currentTab', 'aba-inexistente')

      render(<App />)

      expect(document.title).toBe('BrideHub — Organização de Casamento')
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
    })
  })

  describe('redefinição de senha', () => {
    it('deve exibir a página de redefinição quando a URL tem rota e token', () => {
      window.history.pushState({}, '', '/redefinir-senha?token=abc123')

      render(<App />)

      expect(screen.getByTestId('reset-page')).toHaveAttribute('data-token', 'abc123')
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    })

    it('deve ter prioridade sobre o app mesmo com usuário autenticado', () => {
      localStorage.setItem('bridehub_token', 'token-salvo')
      window.history.pushState({}, '', '/redefinir-senha?token=abc123')

      render(<App />)

      expect(screen.getByTestId('reset-page')).toBeInTheDocument()
      expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
    })

    it('deve voltar ao login e limpar a URL ao sair da redefinição', async () => {
      const user = userEvent.setup()
      window.history.pushState({}, '', '/redefinir-senha?token=abc123')
      render(<App />)

      await user.click(screen.getByText('back-to-login'))

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/')
      expect(window.location.search).toBe('')
    })

    it('não deve exibir a redefinição quando a rota não é /redefinir-senha', () => {
      window.history.pushState({}, '', '/outra-rota?token=abc123')

      render(<App />)

      expect(screen.queryByTestId('reset-page')).not.toBeInTheDocument()
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('não deve exibir a redefinição quando a URL não tem token', () => {
      window.history.pushState({}, '', '/redefinir-senha')

      render(<App />)

      expect(screen.queryByTestId('reset-page')).not.toBeInTheDocument()
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })
})