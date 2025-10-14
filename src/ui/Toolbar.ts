import { ModelerHost } from '../editor/ModelerHost';
import { downloadFile, downloadBlob } from '../lib/files';
import JSZip from 'jszip';
import { BpmnToSpecMapper } from '../mapping/bpmnToSpec';
import { SpecToBpmnMapper } from '../mapping/specToBpmn';
import { MachineSpec } from '../types/machine-spec';
// Using inline SVG icons instead of Lucide constructors

export class Toolbar {
  private container: HTMLElement;
  private modelerHost: ModelerHost;
  private fileInput: HTMLInputElement;
  private bpmnToSpecMapper: BpmnToSpecMapper;
  private specToBpmnMapper: SpecToBpmnMapper;

  constructor(containerSelector: string, modelerHost: ModelerHost) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }
    this.container = container as HTMLElement;
    this.modelerHost = modelerHost;
    this.bpmnToSpecMapper = new BpmnToSpecMapper();
    this.specToBpmnMapper = new SpecToBpmnMapper();
    
    // Create hidden file input for opening files
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.bpmn,.xml,.machine.json';
    this.fileInput.className = 'file-input';
    this.fileInput.addEventListener('change', this.handleFileOpen.bind(this));
    document.body.appendChild(this.fileInput);
  }

  init(): void {
    this.render();
    this.setupEventListeners();
  }

  // Called by ModelerHost after canvas is fully initialized
  onCanvasReady(): void {
    console.log('Canvas ready - updating UI');
    this.updateGridButton();
  }

  private createIconButton(action: string, iconSvg: string, text: string): string {
    return `<button class="toolbar-button" data-action="${action}">
      <span class="button-icon">${iconSvg}</span>
      <span class="button-text">${text}</span>
    </button>`;
  }

  private createIconLink(href: string, iconSvg: string, text: string): string {
    return `<a href="${href}" target="_blank" class="toolbar-button toolbar-link">
      <span class="button-icon">${iconSvg}</span>
      <span class="button-text">${text}</span>
    </a>`;
  }

  private getIcon(name: string): string {
    const icons: Record<string, string> = {
      fileText: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
      folderOpen: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.73 3l-1.73 3a2 2 0 0 1-1.73 1H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>',
      save: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>',
      download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
      archive: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',
      zap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>',
      grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>',
      gridOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="m3 3 18 18"/></svg>',
      bookOpen: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      github: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>'
    };
    return icons[name] || '';
  }

  private render(): void {
    this.container.innerHTML = `
      ${this.createIconButton('new', this.getIcon('fileText'), 'New')}
      ${this.createIconButton('open', this.getIcon('folderOpen'), 'Open BPMN')}
      ${this.createIconButton('save-bpmn', this.getIcon('save'), 'Save BPMN')}
      
      <div class="toolbar-separator"></div>
      
      ${this.createIconButton('export-spec', this.getIcon('download'), 'Export MachineSpec')}
      ${this.createIconButton('import-spec', this.getIcon('upload'), 'Import MachineSpec')}
      
      <div class="toolbar-separator"></div>
      
      ${this.createIconButton('validate', this.getIcon('checkCircle'), 'Validate')}
      ${this.createIconButton('bundle-export', this.getIcon('archive'), 'Bundle Export')}
      
      <div class="toolbar-separator"></div>
      
      ${this.createIconButton('save-now', this.getIcon('zap'), 'Save Now')}
      
      <div class="toolbar-separator"></div>
      
      <button class="toolbar-button" data-action="toggle-grid" title="Grid On">
        <span class="button-icon">${this.getIcon('grid')}</span>
      </button>
      
      <div class="toolbar-separator"></div>
      
      ${this.createIconLink('https://etherisc.github.io/bpmn-studio/', this.getIcon('bookOpen'), 'Docs')}
      ${this.createIconLink('https://github.com/etherisc/bpmn-studio', this.getIcon('github'), 'GitHub')}
      
      <div class="toolbar-separator"></div>
      
      <span class="toolbar-status">Ready</span>
    `;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleButtonClick.bind(this));
  }

  private async handleButtonClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    const action = button?.dataset.action;
    
    console.log('Button clicked:', action);
    if (!action) return;

    try {
      this.setStatus('Processing...');
      
      switch (action) {
        case 'new':
          await this.handleNew();
          break;
        case 'open':
          this.handleOpen();
          break;
        case 'save-bpmn':
          await this.handleSaveBPMN();
          break;
        case 'export-spec':
          await this.handleExportSpec();
          break;
        case 'import-spec':
          this.handleImportSpec();
          break;
        case 'validate':
          await this.handleValidate();
          break;
        case 'bundle-export':
          await this.handleBundleExport();
          break;
        case 'save-now':
          await this.handleSaveNow();
          break;
        case 'toggle-grid':
          this.handleToggleGrid();
          break;
      }
      
      this.setStatus('Ready');
    } catch (error) {
      console.error('Toolbar action failed:', error);
      this.setStatus('Error: ' + (error as Error).message);
    }
  }

  private async handleNew(): Promise<void> {
    const autoSaveService = this.modelerHost.getAutoSaveService();
    
    // Check if there's auto-saved data
    if (autoSaveService && autoSaveService.hasAutoSave()) {
      const confirmed = confirm('Clear canvas? This will discard any unsaved changes.');
      if (!confirmed) {
        return; // User cancelled
      }
      
      // Clear the auto-saved data since user confirmed
      await this.modelerHost.clearAutoSave();
    }
    
    await this.modelerHost.loadBlankTemplate();
  }

  private handleOpen(): void {
    this.fileInput.click();
  }

  private async handleFileOpen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    try {
      const content = await file.text();
      
      if (file.name.endsWith('.machine.json')) {
        // Import MachineSpec
        const spec: MachineSpec = JSON.parse(content);
        const bpmnXml = await this.specToBpmnMapper.convertSpecToBpmn(spec);
        await this.modelerHost.loadBPMN(bpmnXml);
      } else {
        // Assume BPMN XML
        await this.modelerHost.loadBPMN(content);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    } finally {
      // Reset file input
      input.value = '';
    }
  }

  private async handleSaveBPMN(): Promise<void> {
    const xml = await this.modelerHost.exportBPMN();
    downloadFile(xml, 'process.bpmn', 'application/xml');
  }

  private async handleExportSpec(): Promise<void> {
    const bpmnXml = await this.modelerHost.exportBPMN();
    
    const spec = await this.bpmnToSpecMapper.convertBpmnToSpec(bpmnXml);
    console.log('🔍 DEBUG: Converted MachineSpec:', spec);
    
    const jsonContent = JSON.stringify(spec, null, 2);
    downloadFile(jsonContent, `${spec.id}.machine.json`, 'application/json');
  }

  private handleImportSpec(): void {
    // Set file input to accept only JSON files for this action
    this.fileInput.accept = '.machine.json,.json';
    this.fileInput.click();
    // Reset accept attribute after use
    setTimeout(() => {
      this.fileInput.accept = '.bpmn,.xml,.machine.json';
    }, 100);
  }

  private async handleValidate(): Promise<void> {
    const issues = await this.modelerHost.validateCurrentDiagram();
    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const warningCount = issues.filter(issue => issue.type === 'warning').length;
    
    if (errorCount === 0 && warningCount === 0) {
      this.setStatus('Validation passed - no issues found');
    } else {
      this.setStatus(`Validation found ${errorCount} errors, ${warningCount} warnings`);
    }
  }

  private async handleBundleExport(): Promise<void> {
    // Get BPMN and MachineSpec
    const bpmnXml = await this.modelerHost.exportBPMN();
    const spec = await this.bpmnToSpecMapper.convertBpmnToSpec(bpmnXml);
    const specJson = JSON.stringify(spec, null, 2);
    
    // Create manifest
    const manifest = {
      id: spec.id,
      version: spec.version,
      exported_at: new Date().toISOString(),
      hashes: {
        bpmn: await this.calculateSHA256(bpmnXml),
        machine: await this.calculateSHA256(specJson)
      },
      tool_version: '1.0.0'
    };
    const manifestJson = JSON.stringify(manifest, null, 2);
    
    // Create ZIP bundle
    const zip = new JSZip();
    zip.file('process.bpmn', bpmnXml);
    zip.file('process.machine.json', specJson);
    zip.file('manifest.json', manifestJson);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${spec.id}-bundle.zip`);
  }

  private async handleSaveNow(): Promise<void> {
    await this.modelerHost.saveNow();
    // The AutoSaveService will show its own notification
    this.setStatus('Saved');
  }


  private handleToggleGrid(): void {
    this.modelerHost.toggleGrid();
    this.updateGridButton();
    this.setStatus('Grid toggled');
  }

  private updateGridButton(): void {
    const gridButton = this.container.querySelector('[data-action="toggle-grid"]');
    if (gridButton) {
      const isGridVisible = this.modelerHost.isGridVisible();
      const iconSvg = isGridVisible ? this.getIcon('grid') : this.getIcon('gridOff');
      const title = isGridVisible ? 'Turn Grid Off' : 'Turn Grid On';
      
      gridButton.innerHTML = `<span class="button-icon">${iconSvg}</span>`;
      gridButton.setAttribute('title', title);
      
      // Remove active state - keep button consistent with others
      gridButton.classList.remove('active');
    }
  }

  private async calculateSHA256(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256-' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private setStatus(message: string): void {
    const statusElement = this.container.querySelector('.toolbar-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
}
