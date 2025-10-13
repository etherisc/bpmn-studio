# Contributing Guide

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up development environment** (see [setup.md](setup.md))
4. **Create a feature branch** from `develop`
5. **Make your changes** with tests
6. **Submit a pull request**

## Branch Strategy

### Main Branches

- **`main`**: Original development and stable releases
- **`docs`**: GitHub Pages deployment (auto-deployed)
- **`develop`**: Active development branch

### Feature Branches

- **Naming**: `feature/description` or `fix/issue-description`
- **Base**: Always branch from `develop`
- **Merge**: PR to `develop` branch

### Example Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/custom-properties-panel

# Make changes, commit
git add .
git commit -m "Add custom properties panel for insurance metadata"
git push origin feature/custom-properties-panel

# Create PR on GitHub: feature/custom-properties-panel → develop
```

## Code Standards

### TypeScript

- **Strict mode**: All TypeScript strict checks enabled
- **Type annotations**: Explicit types for public APIs
- **ESLint**: Follow configured rules
- **Naming**: camelCase for variables, PascalCase for classes

### File Organization

- **One class per file**: Clear module boundaries
- **Descriptive names**: Files and classes should be self-documenting
- **Barrel exports**: Use index files for clean imports
- **Separation of concerns**: UI, business logic, and data separate

### Code Style

```typescript
// Good: Clear, typed, documented
export class ModelerHost {
  private modeler: Modeler | null = null;
  
  /**
   * Initialize the BPMN modeler with custom modules
   */
  async init(): Promise<void> {
    // Implementation
  }
}

// Avoid: Unclear, untyped
export class MH {
  private m: any;
  init() { /* ... */ }
}
```

## Testing Requirements

### Unit Tests

- **Required for**: Mapping functions, validation rules
- **Framework**: Vitest with jsdom
- **Coverage**: Aim for >80% on core logic
- **Location**: `test/` directory

### Test Structure

```typescript
describe('BpmnToSpecMapper', () => {
  const mapper = new BpmnToSpecMapper();

  it('should convert simple BPMN to MachineSpec', async () => {
    const bpmnXml = `<bpmn:definitions>...</bpmn:definitions>`;
    const spec = await mapper.convertBpmnToSpec(bpmnXml);
    
    expect(spec.id).toBe('expected-id');
    expect(spec.states).toHaveProperty('initial-state');
  });
});
```

### Manual Testing

- **Cross-browser**: Test in Chrome, Firefox, Safari, Edge
- **Functionality**: All toolbar actions work
- **Validation**: Rules prevent invalid operations
- **Round-trip**: BPMN ↔ MachineSpec conversion preserves data

## Pull Request Guidelines

### PR Requirements

- ✅ **Descriptive title**: Clear summary of changes
- ✅ **Detailed description**: What, why, and how
- ✅ **Tests included**: Unit tests for new functionality
- ✅ **Build passes**: No TypeScript or build errors
- ✅ **Documentation updated**: If adding new features

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Review Process

### Code Review

- **Required reviewers**: 1+ team member
- **Focus areas**: Logic, security, performance, maintainability
- **Response time**: Aim for 24-48 hours
- **Approval required**: Before merging

### Automated Checks

- ✅ **TypeScript compilation**: Must pass
- ✅ **Unit tests**: Must pass
- ✅ **Linting**: Must pass
- ✅ **Build**: Must complete successfully

## Release Process

### Version Bumping

- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

### Release Steps

1. **Merge `develop` → `docs`** for deployment
2. **Tag release** with version number
3. **Update CHANGELOG.md**
4. **GitHub release** with notes
5. **Announce** to stakeholders

## Getting Help

- **Technical Questions**: Create GitHub issue
- **Feature Requests**: GitHub discussions
- **Bug Reports**: GitHub issues with reproduction steps
- **Documentation**: Check `/docs/` for public guides

## Code of Conduct

- **Be respectful**: Professional communication
- **Be constructive**: Helpful feedback and suggestions
- **Be collaborative**: Work together toward common goals
- **Be inclusive**: Welcome all contributors
