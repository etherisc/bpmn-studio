import { ModelerHost } from '../editor/ModelerHost';

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  elementId?: string;
}

export class ValidationPane {
  private container: HTMLElement;
  private modelerHost: ModelerHost;
  private issues: ValidationIssue[] = [];
  private isVisible = false;

  constructor(containerSelector: string, modelerHost: ModelerHost) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }
    this.container = container as HTMLElement;
    this.modelerHost = modelerHost;
  }

  init(): void {
    this.render();
    this.setupEventListeners();
    this.hide(); // Hidden by default
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="validation-panel-header">
        <span>Validation Results</span>
        <button class="toolbar-button" data-action="close">×</button>
      </div>
      <div class="validation-panel-content">
        <div class="validation-items"></div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (target.dataset.action === 'close') {
      this.hide();
      return;
    }

    // Check if clicked on a validation item
    const validationItem = target.closest('.validation-item') as HTMLElement;
    if (validationItem) {
      const issueId = validationItem.dataset.issueId;
      if (issueId) {
        this.highlightElement(issueId);
      }
    }
  }

  private highlightElement(elementId: string): void {
    const modeler = this.modelerHost.getModeler();
    if (!modeler) return;

    try {
      const elementRegistry = modeler.get('elementRegistry') as any;
      const selection = modeler.get('selection') as any;
      const canvas = modeler.get('canvas') as any;

      const element = elementRegistry.get(elementId);
      if (element) {
        selection.select(element);
        canvas.scrollToElement(element);
      }
    } catch (error) {
      console.error('Failed to highlight element:', error);
    }
  }

  updateIssues(issues: ValidationIssue[]): void {
    this.issues = issues;
    this.renderIssues();
    
    if (issues.length > 0) {
      this.show();
    } else {
      this.hide();
    }
  }

  private renderIssues(): void {
    const itemsContainer = this.container.querySelector('.validation-items');
    if (!itemsContainer) return;

    if (this.issues.length === 0) {
      itemsContainer.innerHTML = '<div class="validation-item">No issues found</div>';
      return;
    }

    const itemsHtml = this.issues.map(issue => `
      <div class="validation-item ${issue.type}" data-issue-id="${issue.elementId || ''}">
        <span class="validation-icon">${issue.type === 'error' ? '⚠️' : '⚠️'}</span>
        <span class="validation-message">${issue.message}</span>
      </div>
    `).join('');

    itemsContainer.innerHTML = itemsHtml;
  }

  show(): void {
    this.container.classList.remove('hidden');
    this.isVisible = true;
  }

  hide(): void {
    this.container.classList.add('hidden');
    this.isVisible = false;
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  hasErrors(): boolean {
    return this.issues.some(issue => issue.type === 'error');
  }

  getIssues(): ValidationIssue[] {
    return [...this.issues];
  }
}
