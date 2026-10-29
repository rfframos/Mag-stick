# Configurador 3D Mag-stick — entrega inicial

## O que está incluído
- `index.html`, `styles.css`, `app.js`: interface responsiva em português (PT-PT), visualizador Three.js, paletas por componente, seletor HEX, resumo, formulário.
- `assets/MSTICK.obj` e `assets/MSTICK.mtl`: ficheiros CAD originais fornecidos.
- `google-apps-script.gs`: endpoint de receção e validação das respostas para Google Sheets.

## Análise do CAD
O OBJ declara os grupos `Garra`, `Botão`, `Interior`, `Interior_tampa`, `Exterior_tampa` e `Corpo`. O MTL contém dois materiais com cores difusas (`Powder_Coat_-_Rough_(Yellow)` e `Plastic_-_Glossy_(Grey)`), mas não contém texturas ou mapas. O ficheiro OBJ tem cerca de 4,3 MB. A interpretação funcional exata dos nomes — em particular `Garra`, `Botão` e `Interior` — não pode ser confirmada só pelo nome; validar visualmente com o modelo aberto em CAD antes de aprovar o desenho industrial.

## Executar localmente
Não abras `index.html` com duplo clique: o navegador pode bloquear o carregamento do OBJ. Usa um servidor HTTP local, por exemplo:
```bash
python -m http.server 8000
```
Depois abre `http://localhost:8000`. É necessário acesso à internet para carregar Three.js e a fonte Google Fonts a partir de CDN.

## Publicar a interface gratuitamente
1. Cria um repositório GitHub (público para GitHub Pages gratuito).
2. Carrega `index.html`, `styles.css`, `app.js`, a pasta `assets/` e este README.
3. Em Settings → Pages, escolhe `Deploy from a branch`, seleciona `main` e `/ (root)`.
4. Espera pelo URL HTTPS do GitHub Pages e testa-o num telemóvel. Não gerar o QR definitivo até o URL estar estável.
5. O OBJ é ~4,3 MB: o primeiro carregamento pode demorar em rede móvel; idealmente otimizar/converter para GLB numa etapa posterior, mantendo os seis componentes separados.

## Configurar Google Sheets
1. Cria uma Google Sheet. Copia o ID entre `/d/` e `/edit` no URL.
2. Em Extensões → Apps Script, cola o conteúdo de `google-apps-script.gs`; substitui `COLOCA_AQUI_O_ID_DA_TUA_GOOGLE_SHEET` pelo ID real.
3. Guarda e escolhe Implementar → Nova implementação → Aplicação Web.
4. Executar como: tu. Acesso: qualquer pessoa. Implementa e copia o URL terminado em `/exec`.
5. Cola esse URL em `app.js`, no campo `CONFIG.submissionEndpoint`, substituindo `COLOCA_AQUI_O_URL_DO_GOOGLE_APPS_SCRIPT`.
6. Guarda e volta a publicar/atualizar o GitHub Pages.
7. Testa com uma resposta fictícia. Confirma a linha na Sheet antes de distribuir os cartões. O Apps Script fica público para receber submissões; não coloques informação pessoal sensível no formulário.

## Limitação importante de confirmação
O browser envia um POST simples `no-cors` para evitar a preflight CORS típica de Apps Script. O navegador não permite ler a resposta do servidor neste modo; a mensagem da página confirma que o pedido foi enviado pelo browser, mas não prova que a linha foi gravada. A Google Sheet é a fonte de verdade: confirma sempre o registo no teste inicial. Para confirmação de sucesso rigorosa na interface, é necessário usar um backend com CORS configurável ou um intermediário adequado.

## Testes antes de distribuir
- Abrir URL público em iOS Safari e Android Chrome.
- Rodar com rato/dedo, zoom e botão “Repor vista”.
- Alterar uma cor em cada grupo e confirmar que só esse componente muda.
- Enviar resposta de teste e confirmar a linha na Sheet.
- Testar campos vazios, avaliação em falta e comentários longos.
- Verificar se a consola apresenta avisos sobre grupos OBJ não detetados. Se algum componente não mudar de cor, é necessário ajustar o mapeamento do OBJLoader com base na estrutura real carregada.
- Não gerar QR definitivo até o URL público e a recolha estarem testados.

## QR code
Quando o URL público estiver final, gera o QR com uma ferramenta fiável ou localmente:
```bash
python -m pip install qrcode[pil]
python -c "import qrcode; qrcode.make('https://TEU-UTILIZADOR.github.io/TEU-REPOSITORIO/').save('qr-magstick.png')"
```
Usa o URL público completo. Imprime com pelo menos 25 × 25 mm, alto contraste, margem branca e testa o cartão impresso com mais do que um telemóvel.

## Bibliotecas e custos
- Three.js 0.165.0 + OBJLoader + OrbitControls via jsDelivr CDN (gratuitos, código aberto).
- Google Fonts (DM Sans e Manrope), opcional.
- GitHub Pages para alojamento estático e Google Apps Script/Sheets dentro dos limites gratuitos das contas Google. Limites e políticas podem mudar; confirma-os na documentação oficial antes de uma recolha alargada.
