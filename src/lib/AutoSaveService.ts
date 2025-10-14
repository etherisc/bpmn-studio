/**
 * Auto-save service that saves BPMN diagrams to localStorage
 * and restores them on reload
 */

export class AutoSaveService {
  private static readonly STORAGE_KEY = 'process-editor-autosave';
  private static readonly METADATA_KEY = 'process-editor-autosave-meta';
  private modeler: any;
  private saveTimeout: number | null = null;
  private readonly SAVE_DELAY = 2000; // 2 seconds after last change

  constructor(modeler: any) {
    this.modeler = modeler;
    this.init();
  }

  private init(): void {
    // Listen for diagram changes
    this.modeler.on('commandStack.changed', () => {
      this.scheduleSave();
    });

    // Listen for import events to avoid saving during initial load
    this.modeler.on('import.done', () => {
      // Clear any pending saves during import
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
    });

  }

  private scheduleSave(): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    this.saveTimeout = window.setTimeout(() => {
      this.saveToLocalStorage();
      this.saveTimeout = null;
    }, this.SAVE_DELAY);
  }

  private async saveToLocalStorage(): Promise<void> {
    try {
      const result = await this.modeler.saveXML({ format: true });
      const xml = result.xml;

      if (xml) {
        const metadata = {
          savedAt: new Date().toISOString(),
          version: '1.0.0'
        };

        localStorage.setItem(AutoSaveService.STORAGE_KEY, xml);
        localStorage.setItem(AutoSaveService.METADATA_KEY, JSON.stringify(metadata));
        
        this.showSaveIndicator();
      }
    } catch (error) {
      console.error('Failed to auto-save diagram:', error);
    }
  }

  async loadFromLocalStorage(): Promise<boolean> {
    try {
      const savedXml = localStorage.getItem(AutoSaveService.STORAGE_KEY);
      const metadataStr = localStorage.getItem(AutoSaveService.METADATA_KEY);

      if (savedXml && metadataStr) {
        const metadata = JSON.parse(metadataStr);

        await this.modeler.importXML(savedXml);
        this.showRestoreIndicator(metadata.savedAt);
        return true;
      }
    } catch (error) {
      console.error('Failed to load auto-saved diagram:', error);
    }

    return false;
  }

  clearAutoSave(): void {
    localStorage.removeItem(AutoSaveService.STORAGE_KEY);
    localStorage.removeItem(AutoSaveService.METADATA_KEY);
  }

  hasAutoSave(): boolean {
    return localStorage.getItem(AutoSaveService.STORAGE_KEY) !== null;
  }

  getAutoSaveInfo(): { savedAt: string; version: string } | null {
    try {
      const metadataStr = localStorage.getItem(AutoSaveService.METADATA_KEY);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch {
      return null;
    }
  }

  private showSaveIndicator(): void {
    // Show a subtle save indicator
    this.showTemporaryMessage('Auto-saved', 'success');
  }

  private showRestoreIndicator(savedAt: string): void {
    const date = new Date(savedAt);
    const timeStr = date.toLocaleTimeString();
    this.showTemporaryMessage(`Restored from ${timeStr}`, 'info');
  }

  private showTemporaryMessage(message: string, type: 'success' | 'info' | 'warning' = 'info'): void {
    // Create or update status indicator
    let indicator = document.getElementById('autosave-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'autosave-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1000;
        transition: all 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(indicator);
    }

    // Set colors based on type
    const colors = {
      success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
      info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
      warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' }
    };

    const color = colors[type];
    indicator.style.backgroundColor = color.bg;
    indicator.style.border = `1px solid ${color.border}`;
    indicator.style.color = color.text;
    indicator.textContent = message;
    indicator.style.opacity = '1';

    // Fade out after 3 seconds
    setTimeout(() => {
      if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 300);
      }
    }, 3000);
  }

  // Manual save method for toolbar
  async saveNow(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.saveToLocalStorage();
    // Show specific feedback for manual save
    this.showTemporaryMessage('Saved manually', 'success');
  }

  // Force save without delay (for critical operations)
  async forceSave(): Promise<void> {
    await this.saveToLocalStorage();
  }
}
