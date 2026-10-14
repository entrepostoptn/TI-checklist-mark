#!/bin/bash
# ==============================================================================
# Script de Deploy Automático para Hostinger (Git Deployment / Terminal SSH)
# ==============================================================================

set -e

echo "=== [1/4] Instalando dependências do projeto ==="
npm install --legacy-peer-deps --no-audit --prefer-offline

echo "=== [2/4] Gerando build de produção com Vite (Hashed Bundles) ==="
npm run build

echo "=== [3/4] Copiando arquivos compilados da pasta dist/ ==="
if [ -d "dist" ]; then
  # Copia arquivos compilados atualizados para a raiz publicada (public_html)
  cp -r dist/* .
  cp dist/.htaccess . 2>/dev/null || true
  echo "=== [4/4] Arquivos publicados com sucesso! ==="
  echo ">>> As atualizações foram compiladas e aplicadas."
else
  echo "!!! Erro: Diretório dist/ não foi gerado."
  exit 1
fi
