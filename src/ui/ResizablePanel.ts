/**
 * Makes the properties panel resizable by dragging the left edge
 */

export class ResizablePanel {
  private panel: HTMLElement;
  private handle!: HTMLElement;
  private isDragging = false;
  private startX = 0;
  private startWidth = 0;

  constructor(panelSelector: string) {
    const panel = document.querySelector(panelSelector);
    if (!panel) {
      throw new Error(`Panel not found: ${panelSelector}`);
    }
    this.panel = panel as HTMLElement;
    this.init();
  }

  private init(): void {
    // Create resize handle
    this.handle = document.createElement('div');
    this.handle.className = 'properties-resize-handle';
    this.panel.appendChild(this.handle);

    // Add event listeners
    this.handle.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Prevent text selection during drag
    this.handle.addEventListener('selectstart', (e) => e.preventDefault());
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startWidth = parseInt(getComputedStyle(this.panel).width, 10);
    
    this.handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    event.preventDefault();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = this.startX - event.clientX; // Negative because we're dragging from the left
    const newWidth = this.startWidth + deltaX;
    
    // Apply min/max constraints
    const minWidth = 200;
    const maxWidth = 600;
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    this.panel.style.width = `${constrainedWidth}px`;
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  destroy(): void {
    if (this.handle && this.handle.parentNode) {
      this.handle.parentNode.removeChild(this.handle);
    }
  }
}
