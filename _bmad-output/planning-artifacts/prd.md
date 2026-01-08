---
stepsCompleted: [1, 2, 3, 4, 7, 8, 9, 10, 11]
inputDocuments:
  - '_bmad-output/planning-artifacts/produt-brief.md'
workflowType: 'prd'
lastStep: 11
status: complete
completedAt: '2026-01-08'
documentCounts:
  brief: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
skippedSteps: [5, 6]
---

# Product Requirements Document - Apps Script Overhaul

**Author:** Will
**Date:** 2026-01-08
**Status:** Complete

## Executive Summary

Uma extensão Chrome de uso pessoal para customização visual do editor Monaco no Google Apps Script. A ferramenta permite destacar termos específicos no código com cores personalizadas, facilitando o rastreamento visual de objetos e variáveis importantes durante o desenvolvimento.

O foco é simplicidade e velocidade - uma ferramenta leve que resolve um problema específico: melhorar a legibilidade do código através de destaque visual customizável.

### What Makes This Special

Ferramenta pessoal sob medida para o workflow do desenvolvedor, sem overhead de features desnecessárias. A primeira feature consiste em um mini painel que permite gerenciar uma lista de termos e suas cores associadas, aplicando os destaques diretamente no editor Monaco sem necessidade de modificar código.

## Project Classification

**Technical Type:** Browser Extension / Developer Tool
**Domain:** General (Personal Development Tool)
**Complexity:** Low
**Project Context:** Greenfield - new project

Extensão Chrome simples integrando com a API do Monaco Editor para aplicar customizações CSS de syntax highlighting personalizado.

## Success Criteria

### User Success

- A extensão destaca os termos configurados instantaneamente ao carregar o editor
- Zero delay perceptível na aplicação das cores
- Não interfere no funcionamento normal do editor Monaco

### Business Success

N/A - Ferramenta de uso pessoal, sem objetivos comerciais.

### Technical Success

- Extensão leve com footprint mínimo
- Funciona de forma consistente toda vez que o Apps Script é aberto
- Não causa lentidão ou travamentos no editor

### Measurable Outcomes

- Sucesso = termos aparecem coloridos sem delay perceptível
- Falha = qualquer lag visível ou necessidade de refresh manual

## Product Scope

### MVP - Minimum Viable Product

- Mini painel para gerenciar lista de termos e cores
- Aplicação automática dos destaques no editor Monaco
- Persistência das configurações entre sessões

### Growth Features (Post-MVP)

- Adicionar mais termos conforme necessidade surgir

### Vision (Future)

- Outras customizações visuais no editor conforme demanda pessoal

## User Journeys

### Journey 1: First Setup - Configuring the Extension

Will installs the Chrome extension and opens Google Apps Script for the first time after installation. He clicks on the extension icon, which opens a small panel. He adds his first entry: the term "resources" with a pink/rosa color. After saving, he looks at his code and sees "resources" highlighted in pink wherever it appears. Setup complete in under a minute.

### Journey 2: Daily Usage - Seamless Highlighting

Will opens Google Apps Script to work on his project. The extension automatically detects the Monaco editor and applies the saved term highlights. "resources" appears in pink throughout his code without any manual action. He can immediately identify and track the object visually as he navigates through different files.

### Journey 3: Adding New Terms - Expanding Configuration

While working, Will realizes he wants to highlight another frequently used term. He clicks the extension icon, adds a new term with a chosen color, and the highlight is immediately applied to the editor. No page refresh needed.

### Journey Requirements Summary

| Capability | Source Journey |
|------------|----------------|
| Extension popup/panel UI | Journey 1, 3 |
| Term + color configuration | Journey 1, 3 |
| Persistent storage | Journey 2 |
| Auto-detection of Monaco editor | Journey 2 |
| Real-time highlight application | Journey 1, 2, 3 |
| Live updates without refresh | Journey 3 |

## Browser Extension Specific Requirements

### Project-Type Overview

Chrome Extension (Manifest V3) que injeta customizações visuais no editor Monaco do Google Apps Script. A extensão opera exclusivamente no domínio `script.google.com` e utiliza decorators/CSS para aplicar highlighting de termos personalizados.

### Technical Architecture Considerations

**Extension Structure:**
- Manifest V3 (padrão atual do Chrome)
- Content script injetado em `script.google.com/*`
- Popup UI para configuração de termos/cores
- Background service worker (se necessário para coordenação)

**Monaco Integration:**
- Abordagem: CSS injection + Monaco Decorators API
- Detectar instância do Monaco Editor no DOM
- Aplicar decorations nos termos configurados
- Re-aplicar decorations quando o conteúdo do editor mudar

**Data Persistence:**
- `chrome.storage.sync` para sincronização entre dispositivos
- Schema simples: array de objetos `{term: string, color: string}`

### URL Scope & Permissions

**Host Permissions:**
- `https://script.google.com/*`

**Required Permissions:**
- `storage` (para chrome.storage.sync)
- `activeTab` (para interagir com a página)

### Implementation Considerations

- Content script precisa aguardar o Monaco Editor carregar completamente
- Observer pattern (MutationObserver) para detectar mudanças no editor
- Debounce na aplicação de decorators para performance
- Estrutura de arquivos mínima: manifest.json, content.js, popup.html/js, styles.css

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP - resolver o problema específico com o mínimo de features
**Resource Requirements:** Solo developer, sem dependências externas além das APIs do Chrome e Monaco

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1: First Setup (configurar termos/cores)
- Journey 2: Daily Usage (highlighting automático)
- Journey 3: Adding Terms (expandir configuração)

**Must-Have Capabilities:**
- Popup UI para gerenciar lista de termos/cores
- Content script que detecta Monaco Editor
- Aplicação de decorators/CSS para highlighting
- Persistência via chrome.storage.sync

### Post-MVP Features

**Phase 2 (Growth):**
- Mais termos conforme necessidade
- Possíveis melhorias na UI do popup

**Phase 3 (Expansion):**
- Outras customizações visuais no editor (se surgir demanda)

### Risk Mitigation Strategy

**Technical Risks:** Monaco Editor no Apps Script pode não expor a API de decorators diretamente. Fallback: manipulação de DOM/CSS puro.
**Market Risks:** N/A - ferramenta pessoal
**Resource Risks:** N/A - projeto simples de baixo esforço

## Functional Requirements

### Configuration Management

- FR1: User can view a list of all configured term/color pairs
- FR2: User can add a new term with an associated color
- FR3: User can remove an existing term from the list
- FR4: User can modify the color of an existing term
- FR5: User can access the configuration panel via the extension icon

### Highlighting Engine

- FR6: Extension can detect when Monaco Editor is present on the page
- FR7: Extension can apply color highlighting to all instances of configured terms in the editor
- FR8: Extension can update highlights when editor content changes
- FR9: Extension can apply highlights without requiring page refresh
- FR10: Extension can apply multiple different term/color highlights simultaneously

### Data Persistence

- FR11: Extension can save term/color configurations persistently
- FR12: Extension can load saved configurations on page load
- FR13: Extension can sync configurations across user's Chrome browsers

### Scope Control

- FR14: Extension only activates on script.google.com domain

## Non-Functional Requirements

### Performance

- NFR1: Highlights must be applied within 100ms of page/editor load completion
- NFR2: Adding/removing terms must reflect in the editor within 200ms
- NFR3: Extension must not cause perceptible lag when typing in the editor
- NFR4: Memory footprint must remain minimal (< 10MB)

### Integration

- NFR5: Extension must gracefully handle Monaco Editor API unavailability (fallback to CSS-only approach)
- NFR6: Extension must detect Monaco Editor regardless of page load timing variations
- NFR7: Extension must not interfere with native Monaco Editor functionality (autocomplete, syntax highlighting, etc.)

### Reliability

- NFR8: Highlights must persist correctly after page refresh
- NFR9: Configuration changes must be saved immediately to prevent data loss
