import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Diretório de arquivos estáticos compilados
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

// Headers de controle de cache estrito para HTML e Service Worker (Garante atualização imediata)
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html') || req.path === '/sw.js' || req.path === '/manifest.json') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
} else {
  app.use(express.static(publicDir));
}

// Fallback SPA para todas as rotas
app.get('*', (req, res) => {
  const distIndex = path.join(distDir, 'index.html');
  const rootIndex = path.join(__dirname, 'index.html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.sendFile(rootIndex);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Checklist TI] Servidor de produção ativo na porta ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = PORT === 3000 ? 3001 : 3000;
    console.warn(`[Checklist TI] Porta ${PORT} em uso, tentando porta ${fallbackPort}...`);
    app.listen(fallbackPort, '0.0.0.0', () => {
      console.log(`[Checklist TI] Servidor ativo na porta ${fallbackPort}`);
    });
  } else {
    console.error('[Checklist TI] Erro ao iniciar servidor:', err);
  }
});
