/**
 * Palette restrictor that removes unwanted elements from the default palette
 */

export class PaletteRestrictor {
  static $inject = ['eventBus', 'palette'];

  constructor(private eventBus: any, private palette: any) {
    this.init();
  }

  init(): void {
    // Hook into palette creation to filter entries
    this.eventBus.on('palette.create', (event: any) => {
      this.filterPaletteEntries(event);
    });

    // Also hook into palette provider registration
    const originalRegisterProvider = this.palette.registerProvider;
    this.palette.registerProvider = (priority: any, provider?: any) => {
      // If only one argument, it's the provider
      if (typeof priority === 'object' && !provider) {
        provider = priority;
        priority = 1000; // High priority
      }
      
      // Wrap the provider's getPaletteEntries method
      if (provider && provider.getPaletteEntries) {
        const originalGetPaletteEntries = provider.getPaletteEntries.bind(provider);
        provider.getPaletteEntries = (element?: any) => {
          const entries = originalGetPaletteEntries(element);
          return this.filterEntries(entries);
        };
      }
      
      return originalRegisterProvider.call(this.palette, priority, provider);
    };
  }

  private filterPaletteEntries(event: any): void {
    if (event.entries) {
      event.entries = this.filterEntries(event.entries);
    }
  }

  private filterEntries(entries: any): any {
    if (!entries) return entries;

    // List of allowed palette entries
    const allowedEntries = [
      'create.task',
      'create.end-event', 
      'create.participant-expanded',
      'create.lane',
      'lasso-tool',
      'space-tool', 
      'global-connect-tool',
      'hand-tool',
      'palette-separator'
    ];

    // Filter entries to only include allowed ones
    const filteredEntries: any = {};
    
    Object.keys(entries).forEach(key => {
      // Allow separators and tools
      if (key.includes('separator') || 
          key.includes('tool') ||
          allowedEntries.includes(key)) {
        filteredEntries[key] = entries[key];
      }
    });

    return filteredEntries;
  }
}

// Export as a module for bpmn-js
export default {
  __init__: ['paletteRestrictor'],
  paletteRestrictor: ['type', PaletteRestrictor]
};
