#!/usr/bin/env node

/**
 * Script de Teste - Resend API
 * 
 * Este script testa se a API Key do Resend está funcionando corretamente.
 * Execute: node test-resend.js
 */

const https = require('https');

// Ler variável de ambiente
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ ERRO: RESEND_API_KEY não encontrada!');
  console.log('\n📝 Solução:');
  console.log('1. Verifique se existe no arquivo .env.local');
  console.log('2. Execute: export RESEND_API_KEY="sua-api-key"');
  console.log('3. Ou execute: RESEND_API_KEY="sua-api-key" node test-resend.js');
  process.exit(1);
}

console.log('🔍 Testando Resend API...\n');
console.log('📧 API Key:', RESEND_API_KEY.substring(0, 10) + '...');

// Dados do email de teste
const emailData = JSON.stringify({
  from: 'FitAI Pro <onboarding@resend.dev>',
  to: 'delivered@resend.dev', // Email de teste do Resend
  subject: 'Teste de Configuração - FitAI Pro',
  html: '<h1>✅ Configuração funcionando!</h1><p>Se você recebeu este email, sua API Key do Resend está configurada corretamente.</p>'
});

// Configurar requisição
const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': emailData.length
  }
};

// Fazer requisição
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📊 Resposta do servidor:');
    console.log('Status:', res.statusCode);
    
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCESSO! Email de teste enviado!');
        console.log('📧 ID do email:', response.id);
        console.log('\n🎉 Sua configuração está funcionando perfeitamente!');
        console.log('\n📝 Próximos passos:');
        console.log('1. Verifique o email em: delivered@resend.dev');
        console.log('2. Acesse o dashboard: https://resend.com/emails');
        console.log('3. Teste o cadastro no app: http://localhost:3000/login');
      } else {
        console.log('\n❌ ERRO ao enviar email!');
        console.log('Resposta:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 401) {
          console.log('\n🔑 Problema: API Key inválida ou expirada');
          console.log('Solução: Gere uma nova API Key em https://resend.com/api-keys');
        } else if (res.statusCode === 429) {
          console.log('\n⏰ Problema: Limite de envio atingido');
          console.log('Solução: Aguarde ou faça upgrade do plano em https://resend.com/pricing');
        }
      }
    } catch (e) {
      console.log('Resposta (raw):', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERRO na requisição:', error.message);
  console.log('\n📝 Possíveis causas:');
  console.log('1. Sem conexão com internet');
  console.log('2. Firewall bloqueando requisições HTTPS');
  console.log('3. Problema temporário no servidor do Resend');
});

// Enviar requisição
req.write(emailData);
req.end();

console.log('⏳ Enviando requisição para api.resend.com...');
