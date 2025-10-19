# Coding Standards

## TypeScript Guidelines

### Type Safety

```typescript
// ✅ Good: Explicit types
interface ProcessState {
  id: string;
  name: string;
  type: 'task' | 'end';
}

function createState(config: ProcessState): StateNode {
  return { ...config };
}

// ❌ Avoid: Implicit any
function createState(config) {
  return config;
}
```

### Naming Conventions

```typescript
// Variables and functions: camelCase
const currentState = 'created';
const validateProcess = () => {};

// Classes and interfaces: PascalCase
class ModelerHost {}
interface MachineSpec {}

// Constants: UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000;
const ALLOWED_ELEMENTS = ['bpmn:Task'];

// Files: kebab-case or PascalCase for classes
// machine-spec.ts, ModelerHost.ts
```

### Error Handling

```typescript
// ✅ Good: Specific error types and messages
class ValidationError extends Error {
  constructor(elementId: string, message: string) {
    super(`Validation failed for ${elementId}: ${message}`);
    this.name = 'ValidationError';
  }
}

// ✅ Good: Proper async error handling
async function loadBpmn(xml: string): Promise<void> {
  try {
    await this.modeler.importXML(xml);
  } catch (error) {
    console.error('Failed to load BPMN:', error);
    throw new Error(`BPMN import failed: ${error.message}`);
  }
}
```

## File Organization

### Directory Structure

```typescript
// ✅ Good: Clear separation of concerns
src/
├── editor/           # BPMN editor logic
├── ui/              # User interface components  
├── mapping/         # Data transformation
├── lib/             # Utility functions
└── types/           # Type definitions

// ❌ Avoid: Mixed concerns
src/
├── stuff/           # Unclear purpose
├── utils/           # Too generic
└── components/      # Mixed UI and logic
```

### Import Organization

```typescript
// ✅ Good: Organized imports
// External libraries first
import Modeler from 'bpmn-js/lib/Modeler';
import { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';

// Internal modules second
import { ModelerHost } from './editor/ModelerHost';
import { ValidationPane } from './ui/ValidationPane';

// Types last
import { MachineSpec, StateNode } from './types/machine-spec';
```

## Code Style

### Functions

```typescript
// ✅ Good: Clear, single responsibility
async function exportMachineSpec(): Promise<MachineSpec> {
  const bpmnXml = await this.modeler.saveXML();
  const spec = await this.mapper.convertBpmnToSpec(bpmnXml);
  return spec;
}

// ❌ Avoid: Doing too much
async function handleExport() {
  // 50 lines of mixed concerns
}
```

### Classes

```typescript
// ✅ Good: Clear interface, private internals
export class AutoSaveService {
  private static readonly STORAGE_KEY = 'process-editor-autosave';
  private modeler: any;
  private saveTimeout: number | null = null;

  constructor(modeler: any) {
    this.modeler = modeler;
    this.init();
  }

  async saveToLocalStorage(): Promise<void> {
    // Implementation
  }

  private scheduleSave(): void {
    // Private helper
  }
}
```

### Comments

```typescript
// ✅ Good: Explain WHY, not what
// Use autoPlace to properly position and connect the new element
const newElement = autoPlace.append(element, shape);

// Clear any pending saves during import to avoid conflicts
if (this.saveTimeout) {
  clearTimeout(this.saveTimeout);
}

// ❌ Avoid: Obvious comments
// Set the variable to true
isVisible = true;
```

## BPMN-specific Guidelines

### Custom Modules

```typescript
// ✅ Good: Follow bpmn-js patterns
export default {
  __init__: ['customService'],
  customService: ['type', CustomService]
};

// Service replacement (for palette, context pad)
export default {
  __init__: [],
  paletteProvider: ['type', CustomPaletteProvider]
};
```

### Element Handling

```typescript
// ✅ Good: Type-safe element checking
private isTask(element: any): boolean {
  return element.type === 'bpmn:Task';
}

// ✅ Good: Safe property access
private getProperty(element: any, propertyName: string): string {
  const businessObject = element.businessObject;
  return businessObject?.get?.(propertyName) || '';
}
```

### Event Handling

```typescript
// ✅ Good: Proper event listener setup
this.modeler.on('commandStack.changed', () => {
  this.onDiagramChanged();
});

// ✅ Good: Cleanup on destroy
destroy(): void {
  if (this.modeler) {
    this.modeler.destroy();
    this.modeler = null;
  }
}
```

## Testing Standards

### Unit Test Structure

```typescript
describe('BpmnToSpecMapper', () => {
  const mapper = new BpmnToSpecMapper();

  beforeEach(() => {
    // Setup for each test
  });

  it('should handle valid BPMN input', async () => {
    // Arrange
    const bpmnXml = createValidBpmn();
    
    // Act
    const result = await mapper.convertBpmnToSpec(bpmnXml);
    
    // Assert
    expect(result.id).toBe('expected-id');
    expect(result.states).toHaveProperty('created');
  });

  it('should throw error for invalid input', async () => {
    // Arrange
    const invalidXml = '<invalid>xml</invalid>';
    
    // Act & Assert
    await expect(mapper.convertBpmnToSpec(invalidXml))
      .rejects.toThrow('Invalid BPMN XML');
  });
});
```

### Test Data

```typescript
// ✅ Good: Reusable test fixtures
const VALID_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="test-process">
    <bpmn:task id="task1" data-state-name="created" />
  </bpmn:process>
</bpmn:definitions>`;

const VALID_MACHINE_SPEC: MachineSpec = {
  id: 'test',
  version: 1,
  initial: 'created',
  states: {
    created: { type: 'task' }
  }
};
```

## Performance Guidelines

### Bundle Size

- **Target**: <5MB compressed (requirement met)
- **Monitoring**: Check build output warnings
- **Optimization**: Use dynamic imports for large features

### Runtime Performance

```typescript
// ✅ Good: Debounced operations
private scheduleSave(): void {
  if (this.saveTimeout) {
    clearTimeout(this.saveTimeout);
  }
  this.saveTimeout = setTimeout(() => this.save(), 2000);
}

// ✅ Good: Efficient DOM operations
private updateValidationPanel(issues: ValidationIssue[]): void {
  // Batch DOM updates
  const html = issues.map(issue => this.renderIssue(issue)).join('');
  container.innerHTML = html;
}
```

## Documentation Standards

### Code Documentation

```typescript
/**
 * Converts BPMN XML to MachineSpec v2 JSON format
 * 
 * @param bpmnXml - Valid BPMN XML string
 * @param processId - Optional process ID override
 * @param version - MachineSpec version number
 * @returns Promise resolving to MachineSpec object
 * @throws Error if BPMN XML is invalid or conversion fails
 */
async convertBpmnToSpec(
  bpmnXml: string, 
  processId?: string, 
  version: number = 1
): Promise<MachineSpec> {
  // Implementation
}
```

### README Standards

- **Clear purpose**: What the module does
- **Usage examples**: How to use it
- **API reference**: Public methods and properties
- **Dependencies**: What it requires
- **Testing**: How to run tests

## Git Standards

### Commit Messages

```bash
# ✅ Good: Clear, descriptive
git commit -m "Add auto-save functionality with localStorage

- Saves diagram every 2 seconds after changes
- Restores on page reload
- Visual feedback with notifications
- Manual save/clear controls in toolbar"

# ❌ Avoid: Vague
git commit -m "fix stuff"
git commit -m "updates"
```

### Branch Naming

```bash
# ✅ Good: Descriptive
feature/custom-properties-panel
fix/validation-panel-layout
docs/api-reference-update

# ❌ Avoid: Unclear
feature/stuff
fix/bug
my-changes
```

## Security Guidelines

### Input Validation

```typescript
// ✅ Good: Validate all inputs
function validateStateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return /^[a-z][a-z0-9_]*$/.test(name);
}

// ✅ Good: Sanitize user data
function sanitizeDescription(desc: string): string {
  return desc.replace(/<[^>]*>/g, ''); // Remove HTML tags
}
```

### Data Handling

- **No sensitive data**: All data is client-side only
- **localStorage**: Only diagram data, no credentials
- **File exports**: User-initiated only
- **Network requests**: Only for static assets

## Maintenance

### Regular Reviews

- **Monthly**: Dependency updates and security patches
- **Quarterly**: Code quality review and refactoring
- **Annually**: Architecture review and major updates

### Code Quality Metrics

- **TypeScript**: No `any` types in new code (where possible)
- **Test Coverage**: >80% for business logic
- **Bundle Size**: Monitor and optimize
- **Performance**: No blocking operations in UI thread


