# Checklist Operacional TI - Preparação de Computadores de Lojas

Aplicativo para técnicos de TI realizarem formatação, configuração e homologação de computadores e PDVs de lojas, além do controle de Ordens de Serviço (máquinas reservas, no escritório para reparo e prontas).

---

## ⚠️ Como Resolver os Erros no GitHub / Hostinger:
### 1. `Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/plain". main.tsx:1`
### 2. `Failed to load resource: the server responded with a status of 404 () manifest.json:1`

### 💡 Por que esses erros acontecem?
- O navegador **não executa arquivos TypeScript (`.tsx`) diretamente**. O arquivo `main.tsx` só funciona quando o Vite está rodando em modo de desenvolvimento (`npm run dev`).
- Em hospedagens como a **Hostinger (LiteSpeed/Apache)**, o servidor entrega o arquivo `.tsx` como texto comum (`text/plain`), e o navegador bloqueia a execução por segurança.
- O `.gitignore` estava ignorando a pasta `dist/`. Ao fazer `git push` para o GitHub, os arquivos compilados de produção (`.js` e `.css`) **não estavam sendo enviados para o GitHub**, enviando apenas o código-fonte cru.

---

## 🛠️ O que foi corrigido no projeto:

1. **Removido `dist/` do `.gitignore`**: Agora a pasta `dist/` (com os arquivos compilados `.js`, `.css`, `index.html` e `manifest.json`) é rastreada pelo Git e enviada para o seu repositório do GitHub.
2. **Adicionado roteamento inteligente no `.htaccess` da raiz**: Se a Hostinger abrir a raiz do repositório, o servidor Apache/LiteSpeed redireciona internamente para os arquivos compilados da pasta `dist/`, evitando que o navegador tente abrir o `main.tsx`.
3. **Copiados `manifest.json`, `favicon.ico` e `favicon.svg`**: Estão disponíveis tanto na raiz quanto na pasta `public/` e `dist/`, eliminando qualquer erro 404.

---

## 🚀 Como Publicar na Hostinger Sem Erros:

### Opção A: Pelo Git da Hostinger (Mais Prático)
1. No seu computador, gere o build e envie tudo (incluindo a pasta `dist`) para o GitHub:
   ```bash
   npm run build
   git add .
   git commit -m "build de producao"
   git push origin main
   ```
2. No painel da Hostinger (**hPanel > Websites > Gerenciar > Git**):
   - Clique em **Deploy** / **Puxar (Pull)** para atualizar os arquivos do GitHub.
   - **Importante:** No campo de diretório do domínio na Hostinger (ou via `.htaccess` que já configuramos), a pasta `dist/` será servida automaticamente.

### Opção B: Enviar diretamente a pasta `dist/` pelo Gerenciador de Arquivos da Hostinger
1. No seu computador, execute:
   ```bash
   npm run build
   ```
2. Uma pasta chamada **`dist`** será atualizada.
3. No hPanel da Hostinger, abra o **Gerenciador de Arquivos (File Manager)** > entre na pasta **`public_html`**.
4. Envie todo o conteúdo de **dentro** da pasta `dist`:
   - `index.html`
   - `.htaccess`
   - pasta `assets/` (com os arquivos `.js` e `.css`)
   - `favicon.ico`
   - `favicon.svg`
   - `manifest.json`
5. Pronto! Ao acessar seu site, o aplicativo abrirá instantaneamente sem nenhum erro no console.
