# Checklist Operacional TI - Preparação de Computadores de Lojas

Aplicativo para técnicos de TI realizarem formatação, configuração e homologação de computadores e PDVs de lojas.

---

## 🚀 Como Resolver o Erro 403 e Publicar na Hostinger

O **erro 403 Forbidden** na Hostinger acontece principalmente por dois motivos:
1. **Falta do arquivo `.htaccess`** configurado para Single Page Applications (SPA), fazendo o servidor Apache/LiteSpeed bloquear o acesso ou a reescrita de rotas. *(Já corrigido e incluído no projeto!)*
2. **Enviar o código-fonte cru em vez dos arquivos compilados de produção**: Se o repositório for clonado no `public_html` sem executar o build, o navegador tenta acessar arquivos TypeScript (`.tsx`) e o servidor da Hostinger bloqueia por segurança com **403 Forbidden**.

Abaixo estão as 3 formas fáceis de publicar na Hostinger:

---

### Opção 1: Via Git no Painel da Hostinger (hPanel)

Se você conectou o repositório do GitHub diretamente na ferramenta Git da Hostinger:

1. No **hPanel** da Hostinger, vá em **Avançado > Git** (ou **Websites > Gerenciar > Git**).
2. Configure o seu repositório:
   - **Branch:** `main`
   - **Diretório:** `/public_html`
3. No campo **Script de Implantação / Deployment Script** (ou via terminal SSH):
   ```bash
   bash deploy.sh
   ```
4. Clique em **Implantar / Deploy**.
5. O script `deploy.sh` instalará as dependências, rodará o build do Vite e copiará os arquivos de `dist/` para a raiz do seu site automaticamente.

---

### Opção 2: Deploy Automático via GitHub Actions (Recomendado)

O projeto já inclui o arquivo `.github/workflows/deploy-hostinger.yml`.
Com isso, todo `git push` fará o build e enviará para a Hostinger automaticamente.

1. No seu repositório no GitHub, acesse **Settings > Secrets and variables > Actions**.
2. Clique em **New repository secret** e adicione:
   - `FTP_SERVER`: Endereço do host FTP da Hostinger (ex: `ftp.seudominio.com` ou o IP que aparece no hPanel)
   - `FTP_USERNAME`: Seu usuário de FTP da Hostinger (ex: `u123456789`)
   - `FTP_PASSWORD`: Sua senha de FTP da Hostinger
3. Faça qualquer `git push` para a branch `main`. O GitHub Actions fará o build e publicará tudo no `public_html` da Hostinger em segundos!

---

### Opção 3: Upload Manual da pasta `dist/` (Mais simples)

Se preferir enviar os arquivos manualmente:

1. No seu computador, gere o build de produção:
   ```bash
   npm install
   npm run build
   ```
2. Uma pasta chamada **`dist`** será gerada no seu projeto.
3. Abra o **Gerenciador de Arquivos (File Manager)** no hPanel da Hostinger.
4. Entre na pasta **`public_html`**.
5. Envie **o conteúdo de dentro da pasta `dist`** para dentro do `public_html`:
   - `index.html`
   - `.htaccess`
   - pasta `assets/`
   - `favicon.ico`
   - `favicon.svg`
   - `manifest.json`
6. Pronto! Ao acessar seu domínio, o app carregará instantaneamente sem erro 403.

---

## 🛠️ Comandos Locais

```bash
# Iniciar ambiente de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Testar o build de produção localmente
npm run preview
```
