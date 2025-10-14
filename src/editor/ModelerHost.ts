import Modeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';

import RestrictedPaletteModule from './RestrictedPaletteModule';
import RestrictedContextPadModule from './RestrictedContextPadModule';
import RulesProviderModule from './RulesProvider';
import GridModule from 'diagram-js-grid';
// import ErrorFeedbackModule from './ErrorFeedback'; // Removed
// import ConnectionFactoryModule from './ConnectionFactory'; // Not needed
import ProcessPropertiesProviderModule from './ProcessPropertiesProvider';
import NamingServiceModule from './NamingService';
import NamingEventHandlerModule from './NamingEventHandler';
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
        BpmnPropertiesPanelModule, // Official properties panel
        BpmnPropertiesProviderModule, // Official properties provider
        GridModule, // Official grid background
        RestrictedPaletteModule, // Custom palette with only allowed elements
        RestrictedContextPadModule, // Custom context pad with only allowed actions
        RulesProviderModule, // Keep rules to block forbidden elements
        ProcessPropertiesProviderModule, // Integrated custom properties
        NamingServiceModule, // Auto-naming and synchronization
        NamingEventHandlerModule, // Event handling for naming
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
    
    // Rules provider is loaded and working
    
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

  private onSelectionChanged(_event: any): void {
    // Handle element selection for properties panel
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
      
      // Center the diagram after loading
      setTimeout(() => this.centerDiagram(), 100);
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
      // Center the diagram after loading
      setTimeout(() => this.centerDiagram(), 100);
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

  fitViewport(): void {
    if (!this.modeler) return;
    
    const canvas = this.modeler.get('canvas') as any;
    canvas.zoom('fit-viewport', 'auto');
  }

  private centerDiagram(): void {
    if (!this.modeler) return;
    
    try {
      const canvas = this.modeler.get('canvas') as any;
      const elementRegistry = this.modeler.get('elementRegistry') as any;
      
      // Get all elements
      const elements = elementRegistry.getAll();
      const shapes = elements.filter((element: any) => element.type !== 'bpmn:Process');
      
      if (shapes.length > 0) {
        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        shapes.forEach((shape: any) => {
          if (shape.x !== undefined && shape.y !== undefined) {
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + (shape.width || 0));
            maxY = Math.max(maxY, shape.y + (shape.height || 0));
          }
        });
        
        if (minX !== Infinity) {
          // Calculate center point
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          
          // Get canvas dimensions
          const container = canvas.getContainer();
          const containerRect = container.getBoundingClientRect();
          const viewboxCenter = {
            x: containerRect.width / 2,
            y: containerRect.height / 2
          };
          
          // Calculate offset to center the diagram
          const offsetX = viewboxCenter.x - centerX;
          const offsetY = viewboxCenter.y - centerY;
          
          // Apply centering with smooth transition
          canvas.viewbox({
            x: -offsetX,
            y: -offsetY,
            width: containerRect.width,
            height: containerRect.height
          });
          
        }
      } else {
        // No elements, just center the viewport
        canvas.zoom('fit-viewport', 'auto');
      }
    } catch (error) {
      console.error('Failed to center diagram:', error);
      // Fallback to fit viewport
      const canvas = this.modeler.get('canvas') as any;
      canvas.zoom('fit-viewport', 'auto');
    }
  }

  private enableOfficialGrid(): void {
    if (!this.modeler) return;
    
    try {
      // Use the official grid service from diagram-js-grid
      const grid = this.modeler.get('grid') as any;
      if (grid && grid.setVisible) {
        grid.setVisible(true);
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
      
      if (grid) {
        if (grid.isVisible && grid.setVisible) {
          const isVisible = grid.isVisible();
          grid.setVisible(!isVisible);
        } else if (grid.toggle) {
          // Alternative API
          grid.toggle();
        } else {
          // Fallback: try to toggle visibility
          grid.visible = !grid.visible;
        }
      }
    } catch (error) {
      console.error('Failed to toggle grid:', error);
    }
  }

  isGridVisible(): boolean {
    if (!this.modeler) return false;
    
    try {
      const grid = this.modeler.get('grid') as any;
      if (grid) {
        if (grid.isVisible) {
          return grid.isVisible();
        } else if (grid.visible !== undefined) {
          return grid.visible;
        }
      }
    } catch (error) {
      console.error('Failed to check grid visibility:', error);
    }
    
    return false; // Default to not visible
  }

  destroy(): void {
    if (this.modeler) {
      this.modeler.destroy();
      this.modeler = null;
    }
    this.autoSaveService = null;
  }
}
