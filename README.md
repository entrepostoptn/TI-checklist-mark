# Checklist Operacional TI - Gestão de Equipamentos, Manutenção & OS

Aplicativo para técnicos e gestores de TI realizarem controle patrimonial, ordens de serviço, checklist de preparação de máquinas, histórico cronológico de manutenções, peças e relatórios gerenciais com sincronização global em nuvem via Firebase.

---

## 🛠️ Correções Realizadas na Implantação (CI/CD, Hostinger e Nuvem):

1. **Resolução de Conflito de Dependências (`ERESOLVE` no `npm install`)**:
   - O pacote `esbuild` conflitava com a versão embutida do `vite@8`, travando o `npm install` no GitHub Actions e em ambientes de deploy automatizados. O conflito foi resolvido.
2. **Geração do `package-lock.json`**:
   - O GitHub Actions (`actions/setup-node@v4` com `cache: 'npm'`) falhava ao não encontrar o arquivo de lock. O `package-lock.json` foi gerado e incluído.
3. **Criação do Script e Servidor de Produção (`npm start` e `server.js`)**:
   - Contêineres de nuvem (Google Cloud Run / Buildpacks / AI Studio) exigem o comando `npm start`. Criamos o `server.js` com Express que serve a aplicação compilada na porta configurada pelo ambiente (`PORT`).
4. **Fluxo do GitHub Actions Atualizado (`.github/workflows/deploy-hostinger.yml`)**:
   - Suporte aos branches `main` e `master`;
   - Ativação do disparador manual `workflow_dispatch` (botão "Run workflow" no GitHub);
   - Execução com `npm install --legacy-peer-deps` e cache otimizado.
5. **Roteamento `.htaccess` e Script `deploy.sh` Aprimorados**:
   - Compatibilidade total com Apache e LiteSpeed (Hostinger), tratando rotas da SPA sem erros de MIME type ou 404 em subpastas ou domínios raiz.

---

## 🚀 Como Publicar na Hostinger Sem Erros:

### Opção A: Pelo Git da Hostinger (Recomendado)
1. No seu terminal ou repositório, gere o build de produção:
   ```bash
   npm run build
   git add .
   git commit -m "build e correcao de deploy"
   git push origin main
   ```
2. No painel da Hostinger (**hPanel > Websites > Gerenciar > Git**):
   - Clique em **Deploy** / **Puxar (Pull)** para atualizar os arquivos do repositório.
   - O `.htaccess` configurado direciona automaticamente todas as requisições para os arquivos compilados da pasta `dist/`.

### Opção B: Enviar diretamente a pasta `dist/` pelo Gerenciador de Arquivos da Hostinger
1. Execute:
   ```bash
   npm run build
   ```
2. No hPanel da Hostinger, abra o **Gerenciador de Arquivos (File Manager)** e acesse a pasta **`public_html`**.
3. Envie todo o conteúdo de **dentro** da pasta `dist`:
   - `index.html`
   - `.htaccess`
   - pasta `assets/` (`index.js` e `app.css`)
   - `favicon.ico` e `favicon.svg`
   - `manifest.json`
   - `sw.js`
4. Acesse o site no navegador — o sistema abrirá perfeitamente e sincronizado com o Firebase.
