# Checklist Operacional TI - Gestão de Equipamentos, Manutenção & OS

Aplicativo para técnicos e gestores de TI realizarem controle patrimonial, ordens de serviço, checklist de preparação de máquinas, histórico cronológico de manutenções, peças e relatórios gerenciais com sincronização global em nuvem via Firebase.

---

## 💻📱 Acesso por Computador e Celular (Multi-Dispositivo)

O sistema foi arquitetado para funcionar perfeitamente em múltiplos formatos:

* **No Computador (Desktop / Notebook / Bancada)**:
  - Interface ampla para visualização de relatórios, gráficos, histórico em tabela, cadastro em lote e impressão de fichas de OS e termos de entrega.
  - Acesso direto pelo navegador (Chrome, Edge, Firefox, Safari) ou instalação como aplicativo de desktop (PWA).
* **No Celular e Tablet (Smartphone Android / iOS / iPad)**:
  - Interface 100% responsiva adaptada para telas sensíveis ao toque.
  - Ideal para técnicos em campo, no depósito ou nas lojas físicas realizarem checklists na hora e atualizarem o status de máquinas e ordens de serviço.
  - **PWA Instalável**: pode ser adicionado à tela inicial sem precisar de Google Play Store ou Apple App Store (Chrome: "Instalar aplicativo" / Safari: "Adicionar à Tela de Início").
* **Sincronização em Tempo Real (Firebase Firestore)**:
  - Qualquer dado inserido ou alterado no computador reflete imediatamente no celular no mesmo segundo, e vice-versa.
* **Leitor / Gerador de QR Code Embutido**:
  - No menu superior ou no rodapé, clique no botão **"PC & Celular"** para abrir o QR Code e escanear diretamente com a câmera do smartphone.

---

## 🛠️ Por Que as Atualizações Não Estavam Subindo e Como Foi Resolvido:

1. **Ausência de Hashes de Cache-Busting no Vite (`assets/index.js`)**:
   - Os arquivos de saída do Vite estavam fixados com nomes sem hash (`assets/index.js` e `assets/app.css`).
   - Com isso, o navegador do usuário, celulares e o LiteSpeed/Apache da Hostinger guardavam o arquivo antigo em cache de disco e **nunca baixavam a versão nova**, mesmo após publicar novos arquivos.
   - **Solução**: Ativamos hashes de conteúdo únicos no `vite.config.ts` (`assets/[name]-[hash].js` e `assets/[name]-[hash].css`). Qualquer mudança no código gera um nome de arquivo diferente, forçando a atualização instantânea.

2. **Falta de Cabeçalhos Anti-Cache para `index.html` e `sw.js`**:
   - O Apache/LiteSpeed e o Service Worker estavam servindo o `index.html` anterior a partir do cache local.
   - **Solução**: Adicionamos regras estritas de `Cache-Control: no-cache, no-store, must-revalidate, max-age=0` no `.htaccess` (raiz e `public/`) e no `server.js` para que o HTML e o Service Worker nunca fiquem retidos no cache.

3. **Service Worker com Atualização Imediata (`skipWaiting` e `reg.update()`)**:
   - O Service Worker da PWA agora verifica ativamente se há uma nova versão no servidor sempre que a página é carregada e atualiza a aplicação imediatamente (`controllerchange`).

4. **Regras de Roteamento `.htaccess` para a Pasta `dist/`**:
   - Quando o repositório é clonado na Hostinger via Git, o `.htaccess` da raiz agora direciona automaticamente o visitante para `dist/index.html` com os arquivos compilados, sem servir o arquivo cru `src/main.tsx`.

5. **Validação Amigável dos Segredos do GitHub Actions (`deploy-hostinger.yml`)**:
   - Caso use o GitHub Actions para subir via FTP, o workflow agora avisa claramente se os segredos `FTP_SERVER`, `FTP_USERNAME` ou `FTP_PASSWORD` não estiverem configurados no GitHub.

---

## 🚀 Como Publicar na Hostinger Sem Erros:

### Opção 1: Enviar a pasta `dist/` pelo Gerenciador de Arquivos (Mais Rápido e Seguro)
1. No seu computador ou ambiente de desenvolvimento, gere o build:
   ```bash
   npm run build
   ```
2. No painel da Hostinger (**hPanel > Websites > Gerenciar > Gerenciador de Arquivos**), entre na pasta `public_html`.
3. Envie os arquivos que estão **dentro** da pasta `dist/`:
   - `index.html`
   - `.htaccess`
   - Pasta `assets/` (com os arquivos `.js` e `.css` com hash)
   - `sw.js`, `manifest.json`, `favicon.ico`, `favicon.svg`
4. Pronto! O site atualizará instantaneamente em todos os computadores e celulares.

### Opção 2: Pelo Git da Hostinger (hPanel > Git)
1. Antes de dar push para o GitHub, rode o build para que a pasta `dist/` com os arquivos compilados esteja atualizada:
   ```bash
   npm run build
   git add .
   git commit -m "build de producao com atualizacoes"
   git push origin main
   ```
2. No hPanel da Hostinger, clique em **Deploy** / **Puxar (Pull)**.
3. O `.htaccess` configurado cuidará de rotear os acessos diretamente para a versão compilada em `dist/`.

### Opção 3: GitHub Actions Automatizado (FTP Deploy)
Se você configurou o deploy automático pelo GitHub Actions:
1. Vá nas configurações do seu repositório no GitHub: **Settings > Secrets and variables > Actions**.
2. Adicione os 3 segredos (Secrets):
   - `FTP_SERVER`: IP ou host FTP fornecido pela Hostinger (ex: `ftp.seudominio.com` ou o IP da conta).
   - `FTP_USERNAME`: Usuário FTP da Hostinger.
   - `FTP_PASSWORD`: Senha do usuário FTP.
3. A cada commit ou ao clicar em **Run workflow** na aba **Actions**, o GitHub compilará o projeto e enviará automaticamente os arquivos para a Hostinger.
