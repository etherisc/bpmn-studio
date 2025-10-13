# DevContainer Configuration

**Purpose**: Minimal development environment for standalone web applications using Docker containers with automated setup.

## Quick Start

1. Install Docker Desktop and VS Code Dev Containers extension
2. Open project in VS Code → "Reopen in Container"
3. Container auto-installs dependencies and configures environment

## Key Features

- **Node.js 20 LTS** + pnpm + development tools
- **Minimal VS Code extensions** (TypeScript support)
- **Starship prompt** with useful aliases (pn, dev, build, etc.)
- **Auto-forwarded ports**: 5173 (dev server), 4173 (preview server)
- **Persistent storage**: pnpm cache, bash history
- **Lightweight**: Single container, no external services

## Common Aliases

```bash
pn / dev / build / test / lint    # Package management & development
src / docs / root                 # Navigation shortcuts  
g / gs / ga / gc / gp            # Git shortcuts
```

## Available Services

- **http://localhost:5173** - Development server
- **http://localhost:4173** - Preview server

Perfect for developing React, Vue, Angular, or any modern web application with Vite or similar build tools.
