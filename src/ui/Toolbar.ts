import { ModelerHost } from '../editor/ModelerHost';
import { downloadFile, downloadBlob } from '../lib/files';
import JSZip from 'jszip';
import { BpmnToSpecMapper } from '../mapping/bpmnToSpec';
import { SpecToBpmnMapper } from '../mapping/specToBpmn';
import { MachineSpec } from '../types/machine-spec';

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

  private render(): void {
    this.container.innerHTML = `
      <button class="toolbar-button" data-action="new">New</button>
      <button class="toolbar-button" data-action="open">Open BPMN</button>
      <button class="toolbar-button" data-action="save-bpmn">Save BPMN</button>
      
      <div class="toolbar-separator"></div>
      
      <button class="toolbar-button" data-action="export-spec">Export MachineSpec</button>
      <button class="toolbar-button" data-action="import-spec">Import MachineSpec</button>
      
      <div class="toolbar-separator"></div>
      
      <button class="toolbar-button" data-action="validate">Validate</button>
      <button class="toolbar-button" data-action="bundle-export">Bundle Export</button>
      
      <div class="toolbar-separator"></div>
      
      <button class="toolbar-button" data-action="save-now">Save Now</button>
      <button class="toolbar-button" data-action="clear-autosave">Clear Auto-save</button>
      
      <div class="toolbar-separator"></div>
      
      <button class="toolbar-button" data-action="toggle-grid">Toggle Grid</button>
      
      <div class="toolbar-separator"></div>
      
      <a href="https://etherisc.github.io/bpmn-studio/" target="_blank" class="toolbar-button toolbar-link">📖 Docs</a>
      <a href="https://github.com/etherisc/bpmn-studio" target="_blank" class="toolbar-button toolbar-link">🔗 GitHub</a>
      
      <div class="toolbar-separator"></div>
      
      <span class="toolbar-status">Ready</span>
    `;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleButtonClick.bind(this));
  }

  private async handleButtonClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    
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
        case 'clear-autosave':
          await this.handleClearAutoSave();
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
    this.setStatus('Diagram saved to localStorage');
  }

  private async handleClearAutoSave(): Promise<void> {
    const autoSaveService = this.modelerHost.getAutoSaveService();
    if (autoSaveService && autoSaveService.hasAutoSave()) {
      const confirmed = confirm('This will clear the auto-saved diagram. Are you sure?');
      if (confirmed) {
        await this.modelerHost.clearAutoSave();
        this.setStatus('Auto-save cleared');
      }
    } else {
      this.setStatus('No auto-save data found');
    }
  }

  private handleToggleGrid(): void {
    this.modelerHost.toggleGrid();
    this.setStatus('Grid toggled');
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
