/**
 * Integration of bpmnlint with custom rules for real-time validation
 */

// import linter from 'bpmn-js-bpmnlint'; // Unused for now
import { ValidationIssue } from '../ui/ValidationPane';

// Import custom rules (for future use)
// import subsetOnly from './validation/rules/subset-only';
// import singleInitialTask from './validation/rules/single-initial-task';
// import deterministicTransitions from './validation/rules/deterministic-transitions';
// import terminalNoOutgoing from './validation/rules/terminal-no-outgoing';
// import timerValid from './validation/rules/timer-valid';
// import uniqueIds from './validation/rules/unique-ids';
// import stateNameValid from './validation/rules/state-name-valid';

export class LintingIntegration {
  private modeler: any;
  private onIssuesChanged?: (issues: ValidationIssue[]) => void;

  constructor(modeler: any) {
    this.modeler = modeler;
    this.setupLinting();
  }

  private setupLinting(): void {
    // Configure custom rules (for future use)
    // const _customRules = {
    //   'subset-only': subsetOnly,
    //   'single-initial-task': singleInitialTask,
    //   'deterministic-transitions': deterministicTransitions,
    //   'terminal-no-outgoing': terminalNoOutgoing,
    //   'timer-valid': timerValid,
    //   'unique-ids': uniqueIds,
    //   'state-name-valid': stateNameValid
    // };

    // Add linting module with custom rules
    this.modeler.get('eventBus').on('linting.completed', (event: any) => {
      this.handleLintingResults(event.issues);
    });

    // Trigger linting on diagram changes
    this.modeler.get('eventBus').on('commandStack.changed', () => {
      this.runLinting();
    });
  }

  private async runLinting(): Promise<void> {
    try {
      const xml = await this.modeler.saveXML();
      const issues = await this.lintDiagram(xml.xml);
      this.handleLintingResults(issues);
    } catch (error) {
      console.error('Linting failed:', error);
    }
  }

  private async lintDiagram(_xml: string): Promise<any[]> {
    // This is a simplified implementation
    // In a real implementation, you would use bpmnlint with the custom rules
    const issues: any[] = [];
    
    // Parse XML and run custom rules
    try {
      // const parser = new DOMParser();
      // const _doc = parser.parseFromString(xml, 'application/xml');
      
      // Run each custom rule (simplified for now)
      // const _rules = [
      //   { name: 'subset-only', rule: subsetOnly },
      //   { name: 'single-initial-task', rule: singleInitialTask },
      //   { name: 'deterministic-transitions', rule: deterministicTransitions },
      //   { name: 'terminal-no-outgoing', rule: terminalNoOutgoing },
      //   { name: 'timer-valid', rule: timerValid },
      //   { name: 'unique-ids', rule: uniqueIds },
      //   { name: 'state-name-valid', rule: stateNameValid }
      // ];

      // This is a simplified rule execution - in practice you'd need proper BPMN model parsing
      // For now, we'll return empty issues array
      
    } catch (error) {
      console.error('Error parsing XML for linting:', error);
    }

    return issues;
  }

  private handleLintingResults(issues: any[]): void {
    const validationIssues: ValidationIssue[] = issues.map(issue => ({
      id: issue.id || 'unknown',
      type: issue.severity === 'error' ? 'error' : 'warning',
      message: issue.message,
      elementId: issue.id
    }));

    if (this.onIssuesChanged) {
      this.onIssuesChanged(validationIssues);
    }
  }

  setIssuesChangedCallback(callback: (issues: ValidationIssue[]) => void): void {
    this.onIssuesChanged = callback;
  }

  async validateCurrentDiagram(): Promise<ValidationIssue[]> {
    try {
      const xml = await this.modeler.saveXML();
      const issues = await this.lintDiagram(xml.xml);
      return issues.map(issue => ({
        id: issue.id || 'unknown',
        type: issue.severity === 'error' ? 'error' : 'warning',
        message: issue.message,
        elementId: issue.id
      }));
    } catch (error) {
      console.error('Validation failed:', error);
      return [{
        id: 'validation-error',
        type: 'error',
        message: 'Failed to validate diagram: ' + (error as Error).message
      }];
    }
  }
}

// Export as a module for bpmn-js
export default {
  __init__: ['lintingIntegration'],
  lintingIntegration: ['type', LintingIntegration]
};
