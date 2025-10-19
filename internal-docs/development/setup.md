# Development Setup Guide

## Prerequisites

- **Node.js**: Version 20+ (see `.nvmrc`)
- **pnpm**: Version 9+ (package manager)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Quick Start

```bash
# Clone the repository
git clone https://github.com/etherisc/bpmn-studio.git
cd bpmn-studio

# Switch to develop branch
git checkout develop

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open http://localhost:3000
```

## Development Commands

```bash
# Development server (hot reload)
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm test

# Run linting
pnpm run lint

# Preview production build
pnpm run preview
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── editor/                 # BPMN editor modules
│   ├── ModelerHost.ts     # Core modeler management
│   ├── RestrictedPaletteModule.ts
│   ├── RestrictedContextPadModule.ts
│   ├── RulesProvider.ts
│   ├── LintingIntegration.ts
│   └── validation/rules/  # Custom bpmnlint rules
├── ui/                    # User interface components
│   ├── Toolbar.ts
│   └── ValidationPane.ts
├── mapping/               # BPMN ↔ MachineSpec conversion
│   ├── bpmnToSpec.ts
│   └── specToBpmn.ts
├── lib/                   # Utility libraries
│   ├── AutoSaveService.ts
│   └── files.ts
└── types/                 # TypeScript type definitions
    ├── machine-spec.ts
    └── bpmn-modules.d.ts
```

## Key Technologies

- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **bpmn-js**: BPMN modeling engine
- **diagram-js-grid**: Official grid background
- **bpmnlint**: BPMN validation
- **JSZip**: Bundle export functionality
- **Vitest**: Unit testing framework

## Development Workflow

### Feature Development

1. **Create feature branch** from `develop`
2. **Implement feature** with tests
3. **Test locally** with `pnpm run dev`
4. **Run tests** with `pnpm test`
5. **Build check** with `pnpm run build`
6. **Commit and push** to feature branch
7. **Create PR** to `develop` branch

### Deployment

1. **Merge to `docs` branch** when ready
2. **GitHub Actions** automatically builds and deploys
3. **Live at** `https://etherisc.github.io/bpmn-studio/`

## Debugging

### Common Issues

**Build Errors**:
- Check TypeScript errors with `pnpm run build`
- Verify all imports are correct
- Check for unused variables/imports

**Runtime Errors**:
- Open browser dev tools
- Check console for errors
- Verify asset loading paths

**Test Failures**:
- Run `pnpm test` for detailed output
- Check test setup in `test/setup.ts`
- Verify mocks are working correctly

### Development Tools

- **Browser DevTools**: Essential for debugging
- **Vue DevTools**: Not applicable (vanilla TypeScript)
- **Network Tab**: Check asset loading
- **Console**: Application logs and errors

## Hot Reload

The development server supports hot reload for:
- ✅ TypeScript files
- ✅ CSS files
- ✅ HTML templates
- ❌ Configuration files (requires restart)


