import '../assets/styles/editor.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';

import { ModelerHost } from './editor/ModelerHost';
import { Toolbar } from './ui/Toolbar';
import { ValidationPane } from './ui/ValidationPane';

class ProcessEditor {
  private modelerHost: ModelerHost;
  private toolbar: Toolbar;
  private validationPane: ValidationPane;

  constructor() {
    this.modelerHost = new ModelerHost('#canvas');
    this.toolbar = new Toolbar('#toolbar', this.modelerHost);
    this.validationPane = new ValidationPane('#validation-panel', this.modelerHost);

    this.init();
  }

  private async init() {
    try {
      await this.modelerHost.init();
      this.toolbar.init();
      this.validationPane.init();
      
      // Connect validation callback
      this.modelerHost.setValidationCallback((issues) => {
        this.validationPane.updateIssues(issues);
      });
      
      // Load blank template by default
      await this.modelerHost.loadBlankTemplate();
      
      console.log('Process Editor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Process Editor:', error);
    }
  }
}

// Initialize the editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ProcessEditor();
});
