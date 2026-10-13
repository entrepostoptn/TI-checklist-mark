#!/bin/bash
# ==============================================================================
# Script de Deploy Automático para Hostinger (Git Deployment / CI)
# ==============================================================================

echo "=== [1/3] Instalando dependências do projeto ==="
npm install --no-audit --prefer-offline

echo "=== [2/3] Gerando build de produção com Vite ==="
npm run build

echo "=== [3/3] Publicando arquivos compilados da pasta dist/ ==="
if [ -d "dist" ]; then
  # Copia index.html, assets, .htaccess, favicon e manifest para o diretório raiz publicado
  cp -r dist/* .
  cp dist/.htaccess . 2>/dev/null || true
  echo ">>> Sucesso: Build concluído e arquivos publicados para a Hostinger!"
else
  echo "!!! Erro: Diretório dist/ não foi gerado."
  exit 1
fi
