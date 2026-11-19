import React, { useState } from 'react';
import { Heart, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface ResetPasswordPageProps {
  token: string;
  onBackToLogin: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token, onBackToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        password,
      });
      setSuccessMessage(response.data?.message || 'Senha redefinida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setErrorMessage(
        error.response?.data?.error || 'Não foi possível redefinir a senha. Solicite um novo link.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, oklch(0.97 0.02 15), oklch(0.93 0.04 30))',
      }}
    >
      <div className="bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl w-full max-w-md p-8 sm:p-10 space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/20">
            <Heart className="size-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">BrideHub</h1>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground font-display">Criar nova senha</h2>
            <p className="text-xs text-muted-foreground">
              Escolha uma nova senha segura para acessar sua conta.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {successMessage ? (
          <div className="space-y-5 text-center">
            <div className="p-4 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-2">
              <CheckCircle2 className="size-6 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 p-0"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};