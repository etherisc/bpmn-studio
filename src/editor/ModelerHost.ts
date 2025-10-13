import Modeler from 'bpmn-js/lib/Modeler';
import { 
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';

import RestrictedPaletteModule from './RestrictedPaletteModule';
import RestrictedContextPadModule from './RestrictedContextPadModule';
import RulesProviderModule from './RulesProvider';
import GridModule from 'diagram-js-grid';
// import PropertiesBindingsModule from './PropertiesBindings'; // Temporarily disabled
import { LintingIntegration } from './LintingIntegration';
import { ValidationIssue } from '../ui/ValidationPane';
import { AutoSaveService } from '../lib/AutoSaveService';

export class ModelerHost {
  private modeler: Modeler | null = null;
  private container: HTMLElement;
  private lintingIntegration: LintingIntegration | null = null;
  private autoSaveService: AutoSaveService | null = null;
  private validationCallback?: (issues: ValidationIssue[]) => void;

  constructor(containerSelector: string) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }
    this.container = container as HTMLElement;
  }

  async init(): Promise<void> {
    this.modeler = new Modeler({
      container: this.container,
      keyboard: {
        bindTo: document
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        GridModule, // Official grid background
        RestrictedPaletteModule, // Custom palette with only allowed elements
        RestrictedContextPadModule, // Custom context pad with only allowed actions
        RulesProviderModule, // Keep rules to block forbidden elements
        // PropertiesBindingsModule, // Temporarily disabled
      ],
      propertiesPanel: {
        parent: '#properties-panel'
      },
      canvas: {
        deferUpdate: false
      }
    });

    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize linting
    this.lintingIntegration = new LintingIntegration(this.modeler);
    if (this.validationCallback) {
      this.lintingIntegration.setIssuesChangedCallback(this.validationCallback);
    }

    // Initialize auto-save
    this.autoSaveService = new AutoSaveService(this.modeler);
    
    // Enable grid background (official implementation)
    this.enableOfficialGrid();
  }

  private setupEventListeners(): void {
    if (!this.modeler) return;

    // Listen for diagram changes
    this.modeler.on('commandStack.changed', () => {
      this.onDiagramChanged();
    });

    // Listen for element selection
    this.modeler.on('selection.changed', (event) => {
      this.onSelectionChanged(event);
    });
  }

  private onDiagramChanged(): void {
    // Trigger validation when diagram changes
    this.validateDiagram();
  }

  private onSelectionChanged(event: any): void {
    // Handle element selection for properties panel
    console.log('Selection changed:', event.newSelection);
  }

  private validateDiagram(): void {
    // Validation is now handled by LintingIntegration
    if (this.lintingIntegration) {
      // Validation will be triggered automatically by linting integration
    }
  }

  setValidationCallback(callback: (issues: ValidationIssue[]) => void): void {
    this.validationCallback = callback;
    if (this.lintingIntegration) {
      this.lintingIntegration.setIssuesChangedCallback(callback);
    }
  }

  async validateCurrentDiagram(): Promise<ValidationIssue[]> {
    if (!this.lintingIntegration) {
      return [];
    }
    return this.lintingIntegration.validateCurrentDiagram();
  }

  async loadBlankTemplate(): Promise<void> {
    if (!this.modeler || !this.autoSaveService) {
      throw new Error('Modeler not initialized');
    }

    try {
      // First, try to load from auto-save
      const hasAutoSave = await this.autoSaveService.loadFromLocalStorage();
      
      if (!hasAutoSave) {
        // No auto-save found, load blank template
        const response = await fetch('./templates/blank.bpmn');
        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.statusText}`);
        }
        const xml = await response.text();
        await this.modeler.importXML(xml);
      }
      
      this.fitViewport();
    } catch (error) {
      console.error('Failed to load template:', error);
      throw error;
    }
  }

  async loadBPMN(xml: string): Promise<void> {
    if (!this.modeler) {
      throw new Error('Modeler not initialized');
    }

    try {
      await this.modeler.importXML(xml);
      this.fitViewport();
    } catch (error) {
      console.error('Failed to load BPMN:', error);
      throw error;
    }
  }

  async exportBPMN(): Promise<string> {
    if (!this.modeler) {
      throw new Error('Modeler not initialized');
    }

    try {
      const result = await this.modeler.saveXML({ format: true });
      return result.xml || '';
    } catch (error) {
      console.error('Failed to export BPMN:', error);
      throw error;
    }
  }

  private fitViewport(): void {
    if (!this.modeler) return;
    
    const canvas = this.modeler.get('canvas') as any;
    canvas.zoom('fit-viewport');
  }

  private enableOfficialGrid(): void {
    if (!this.modeler) return;
    
    try {
      // Use the official grid service from diagram-js-grid
      const grid = this.modeler.get('grid') as any;
      if (grid && grid.setVisible) {
        grid.setVisible(true);
        console.log('Official grid background enabled');
      }
    } catch (error) {
      console.error('Failed to enable official grid background:', error);
    }
  }

  getModeler(): Modeler | null {
    return this.modeler;
  }

  getAutoSaveService(): AutoSaveService | null {
    return this.autoSaveService;
  }

  async clearAutoSave(): Promise<void> {
    if (this.autoSaveService) {
      this.autoSaveService.clearAutoSave();
    }
  }

  async saveNow(): Promise<void> {
    if (this.autoSaveService) {
      await this.autoSaveService.saveNow();
    }
  }

  toggleGrid(): void {
    if (!this.modeler) return;
    
    try {
      // Use the official grid service from diagram-js-grid
      const grid = this.modeler.get('grid') as any;
      if (grid && grid.isVisible && grid.setVisible) {
        const isVisible = grid.isVisible();
        grid.setVisible(!isVisible);
        console.log('Grid toggled:', !isVisible ? 'visible' : 'hidden');
      }
    } catch (error) {
      console.error('Failed to toggle grid:', error);
    }
  }

  destroy(): void {
    if (this.modeler) {
      this.modeler.destroy();
      this.modeler = null;
    }
    this.autoSaveService = null;
  }
}
