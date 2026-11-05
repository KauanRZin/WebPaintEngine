# WebPaintEngine

Um estúdio de desenho vetorial no navegador, feito com React, TypeScript e Canvas. Desenhe, ajuste seus traços e exporte suas criações sem sair da página.

## Recursos

- Pincel livre com suavização, fluxo e pressão simulada.
- Ferramentas de borracha, linha, retângulo e elipse.
- Ajustes de cor, espessura e opacidade, além de formas preenchidas.
- Histórico de desfazer/refazer com até 50 estados.
- Fundos em grade, branco, escuro ou transparente.
- Exportação em PNG, JPEG ou SVG, com escala de até 2x.
- Atalhos de teclado e interface responsiva.

## Tecnologias

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · perfect-freehand

## Como executar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

O Vite exibirá no terminal o endereço local para abrir no navegador.

### Build de produção

```bash
npm run build
npm run preview
```

### Docker

```bash
docker compose up --build
```

A aplicação ficará disponível em `http://localhost:8080`. Para alterar a porta:

```bash
PORT=3000 docker compose up --build
```

No PowerShell:

```powershell
$env:PORT=3000
docker compose up --build
```

## Atalhos

| Tecla | Ação |
| --- | --- |
| `B` | Pincel |
| `E` | Borracha |
| `L` | Linha |
| `R` | Retângulo |
| `C` | Elipse |
| `[` / `]` | Diminuir / aumentar o pincel |
| `F` | Alternar preenchimento da forma |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` ou `Ctrl+Shift+Z` | Refazer |
| `Ctrl+E` ou `Ctrl+S` | Exportar |
| `?` | Mostrar atalhos |

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](./LICENSE).
