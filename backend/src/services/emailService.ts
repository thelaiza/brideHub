import { Resend } from 'resend';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function resolveEmailConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const resendFrom = process.env.RESEND_FROM?.trim();

  if (isProduction) {
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY é obrigatória em produção.');
    }
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL é obrigatória em produção.');
    }
    if (!resendFrom) {
      throw new Error('RESEND_FROM é obrigatória em produção.');
    }
  }

  return {
    isProduction,
    resendApiKey,
    resolvedFrontendUrl: (frontendUrl || 'http://localhost:5173').replace(/\/$/, ''),
    resolvedFrom: resendFrom || 'BrideHub <onboarding@resend.dev>',
  };
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const { isProduction, resendApiKey, resolvedFrontendUrl, resolvedFrom } = resolveEmailConfig();
  const resetLink = `${resolvedFrontendUrl}/redefinir-senha?token=${encodeURIComponent(resetToken)}`;

  if (!resendApiKey) {
    if (!isProduction) {
      console.warn(`[email] RESEND_API_KEY não configurada. Link de redefinição para ${to}: ${resetLink}`);
    } else {
      console.warn(`[email] RESEND_API_KEY não configurada para ${to}.`);
    }
    return;
  }

  const resend = new Resend(resendApiKey);
  const safeName = escapeHtml(name);

  const { data, error } = await resend.emails.send({
    from: resolvedFrom,
    to,
    subject: 'Redefinição de senha - BrideHub',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #be185d;">Redefinição de senha</h2>
        <p>Olá, <strong>${safeName}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>BrideHub</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>30 minutos</strong>:</p>
        <div style="margin: 28px 0;">
          <a href="${resetLink}"
             style="background-color: #be185d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Redefinir minha senha
          </a>
        </div>
        <p style="font-size: 13px; color: #6b7280;">
          Se você não solicitou essa alteração, pode ignorar este e-mail com segurança. Sua senha permanecerá a mesma.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Erro ao enviar via Resend:', error);
    throw new Error('Falha ao enviar o e-mail de redefinição.');
  }

  console.log(`[email] Resend aceitou o envio (id: ${data?.id}) para ${to}`);
}

export async function sendGoogleAccountEmail(to: string, name: string) {
  const { isProduction, resendApiKey, resolvedFrontendUrl, resolvedFrom } = resolveEmailConfig();

  if (!resendApiKey) {
    if (!isProduction) {
      console.warn(`[email] RESEND_API_KEY não configurada. Aviso de conta Google não enviado para ${to}`);
    }
    return;
  }

  const resend = new Resend(resendApiKey);
  const safeName = escapeHtml(name);

  const { data, error } = await resend.emails.send({
    from: resolvedFrom,
    to,
    subject: 'Sua conta BrideHub usa o login do Google',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #be185d;">Acesso com o Google</h2>
        <p>Olá, <strong>${safeName}</strong>!</p>
        <p>Recebemos um pedido de redefinição de senha, mas a sua conta no <strong>BrideHub</strong> foi criada com o <strong>login do Google</strong> e não tem uma senha própria.</p>
        <p>Para entrar, use o botão "Continuar com o Google" na tela de login. Se precisar recuperar o acesso, a senha é redefinida diretamente na sua conta Google.</p>
        <div style="margin: 28px 0;">
          <a href="${resolvedFrontendUrl}"
             style="background-color: #be185d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Ir para o BrideHub
          </a>
        </div>
        <p style="font-size: 13px; color: #6b7280;">
          Se você não fez esse pedido, pode ignorar este e-mail.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Erro ao enviar aviso de conta Google via Resend:', error);
    throw new Error('Falha ao enviar o aviso de conta Google.');
  }

  console.log(`[email] Aviso de conta Google enviado (id: ${data?.id}) para ${to}`);
}