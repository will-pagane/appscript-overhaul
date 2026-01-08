# Apps Script Overhaul

Extensao Chrome para customizacao visual do editor Monaco no Google Apps Script. Permite destacar termos especificos no codigo com cores personalizadas, facilitando o rastreamento visual de objetos e variaveis importantes durante o desenvolvimento.

## Motivacao

Ferramenta pessoal sob medida para melhorar a legibilidade do codigo atraves de destaque visual customizavel. O primeiro caso de uso e destacar o termo "resources" em rosa para facilitar o acompanhamento visual deste objeto frequentemente utilizado.

## Features

- **Painel de Configuracao**: Mini popup para gerenciar lista de termos e cores
- **Highlighting Automatico**: Aplica cores configuradas automaticamente ao carregar o editor
- **Atualizacoes em Tempo Real**: Mudancas refletem imediatamente sem refresh da pagina
- **Persistencia**: Configuracoes sincronizadas entre sessoes e dispositivos via Chrome Storage
- **Fallback CSS**: Funciona mesmo se a API do Monaco nao estiver disponivel

## Stack Tecnologico

| Tecnologia | Versao | Notas |
|------------|--------|-------|
| TypeScript | 5.x | Strict mode habilitado |
| Target | ES2020 | Suporte a navegadores modernos |
| Chrome Extension | Manifest V3 | Padrao atual |
| @types/chrome | Latest | Tipagens para API do Chrome |

## Estrutura do Projeto

```
apps-script-overhaul-extension/
├── manifest.json                 # Configuracao da extensao (MV3)
├── package.json                  # Dependencias e scripts NPM
├── tsconfig.json                 # Configuracao TypeScript
│
├── src/
│   ├── popup/
│   │   ├── popup.html            # UI do popup
│   │   ├── popup.ts              # Logica do popup (CRUD de termos)
│   │   └── popup.css             # Estilos do popup
│   │
│   ├── content/
│   │   ├── content.ts            # Entry point do content script
│   │   ├── monaco-detector.ts    # Deteccao do Monaco Editor
│   │   ├── highlighter.ts        # Engine de highlighting
│   │   └── css-fallback.ts       # Fallback via CSS
│   │
│   ├── shared/
│   │   ├── types.ts              # Interfaces TypeScript
│   │   ├── storage.ts            # Wrapper para Chrome Storage
│   │   ├── constants.ts          # Constantes compartilhadas
│   │   └── messaging.ts          # Utilitarios de mensagens
│   │
│   └── utils/
│       └── debounce.ts           # Funcao utilitaria debounce
│
├── dist/                         # Output compilado
└── icons/                        # Icones da extensao
```

## Instalacao

### Pre-requisitos

- Node.js instalado
- Google Chrome

### Setup

1. Clone o repositorio:
```bash
git clone <repo-url>
cd apps-script-overhaul-extension
```

2. Instale as dependencias:
```bash
npm install
```

3. Compile o projeto:
```bash
npm run build
```

4. Carregue a extensao no Chrome:
   - Acesse `chrome://extensions/`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactacao"
   - Selecione a pasta `dist/`

## Uso

1. Abra o Google Apps Script (`script.google.com`)
2. Clique no icone da extensao na barra do Chrome
3. Adicione termos e selecione cores no popup
4. Os termos configurados serao destacados automaticamente no editor

## Desenvolvimento

### Comandos

```bash
npm run build      # Compila TypeScript e copia arquivos estaticos
npm run watch      # Modo watch para desenvolvimento
```

### Workflow

1. Edite os arquivos em `src/`
2. Execute `npm run build`
3. Recarregue a extensao em `chrome://extensions/`
4. Teste em `script.google.com`

## Arquitetura

### Comunicacao

```
┌─────────────┐     chrome.storage     ┌─────────────────┐
│   Popup     │◄──────────────────────►│  Content Script │
│  (popup.ts) │     chrome.runtime     │  (content.ts)   │
└─────────────┘     .sendMessage       └─────────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                        ┌─────────────────┐
│   Storage   │                        │  Monaco Editor  │
│   (sync)    │                        │  (page DOM)     │
└─────────────┘                        └─────────────────┘
```

### Estrategia de Integracao Monaco

- **Primario**: API `editor.deltaDecorations()` do Monaco
- **Fallback**: Injecao de CSS se API nao disponivel
- **Deteccao**: MutationObserver + polling como safety net

### Permissoes

- `storage`: Para chrome.storage.sync
- `activeTab`: Para interagir com a pagina
- **Host**: `https://script.google.com/*`

## Requisitos de Performance

- Highlights aplicados em < 100ms apos carregamento
- Mudancas de configuracao refletidas em < 200ms
- Sem lag perceptivel durante digitacao
- Footprint de memoria < 10MB

## Licenca

Uso pessoal.
