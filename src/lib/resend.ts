import { Resend } from 'resend'

// Inicializar Resend com a API key do ambiente
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('⚠️ RESEND_API_KEY não configurada - emails não serão enviados')
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Helper para verificar se o Resend está configurado
export function isResendConfigured(): boolean {
  return !!resend
}

// Template de email de verificação
export function getVerificationEmailTemplate(otpCode: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu cadastro</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">⚡ FitAI Pro</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Seu personal trainer inteligente</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px; font-weight: bold;">Bem-vindo ao FitAI Pro! 🎉</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      Estamos muito felizes em ter você conosco! Para completar seu cadastro e começar sua jornada fitness, use o código de verificação abaixo:
                    </p>
                    
                    <!-- OTP Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #f1f5f9; border-radius: 12px; padding: 30px;">
                          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Seu código de verificação</p>
                          <p style="margin: 0; color: #1e293b; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        ⏰ <strong>Atenção:</strong> Este código expira em <strong>10 minutos</strong>. Se você não solicitou este cadastro, ignore este email.
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0 0; color: #475569; font-size: 14px; line-height: 1.6;">
                      Após inserir o código, você terá acesso completo a:
                    </p>
                    
                    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                      <li>Planos de treino personalizados com IA</li>
                      <li>Acompanhamento de progresso com fotos</li>
                      <li>Dietas adaptadas aos seus objetivos</li>
                      <li>Análise inteligente de refeições</li>
                    </ul>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                      Precisa de ajuda? Entre em contato conosco
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} FitAI Pro. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

// Template de email de reenvio de código
export function getResendCodeEmailTemplate(otpCode: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo código de verificação</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">⚡ FitAI Pro</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Seu personal trainer inteligente</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px; font-weight: bold;">Novo código de verificação 🔄</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      Você solicitou um novo código de verificação. Use o código abaixo para confirmar seu cadastro:
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #f1f5f9; border-radius: 12px; padding: 30px;">
                          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Seu novo código</p>
                          <p style="margin: 0; color: #1e293b; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        ⏰ <strong>Atenção:</strong> Este código expira em <strong>10 minutos</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                      Precisa de ajuda? Entre em contato conosco
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} FitAI Pro. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

// Função helper para enviar email de verificação
export async function sendVerificationEmail(email: string, otpCode: string) {
  if (!resend) {
    console.error('❌ Resend não configurado - não é possível enviar email')
    return { success: false, error: 'Serviço de email não configurado' }
  }

  try {
    const result = await resend.emails.send({
      from: 'FitAI Pro <onboarding@resend.dev>',
      to: email,
      subject: 'Confirme seu cadastro - FitAI Pro',
      html: getVerificationEmailTemplate(otpCode)
    })

    console.log('✅ Email de verificação enviado com sucesso:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error)
    return { success: false, error }
  }
}

// Função helper para reenviar código de verificação
export async function sendResendCodeEmail(email: string, otpCode: string) {
  if (!resend) {
    console.error('❌ Resend não configurado - não é possível enviar email')
    return { success: false, error: 'Serviço de email não configurado' }
  }

  try {
    const result = await resend.emails.send({
      from: 'FitAI Pro <onboarding@resend.dev>',
      to: email,
      subject: 'Novo código de verificação - FitAI Pro',
      html: getResendCodeEmailTemplate(otpCode)
    })

    console.log('✅ Email de reenvio enviado com sucesso:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Erro ao enviar email de reenvio:', error)
    return { success: false, error }
  }
}
