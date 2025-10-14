// Test setup file for vitest
import { vi } from 'vitest';

// Mock crypto.subtle for Node.js environment
if (!globalThis.crypto) {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

// Enhanced DOM mocks for testing
const mockElement = {
  setAttribute: vi.fn(),
  getAttribute: vi.fn(() => null),
  getAttributeNS: vi.fn(() => null),
  appendChild: vi.fn(),
  insertBefore: vi.fn(),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  textContent: '',
  id: 'mock-element',
  ownerDocument: null as any
};

const mockDocument = {
  documentElement: mockElement,
  createElementNS: vi.fn(() => ({ ...mockElement, ownerDocument: mockDocument })),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  implementation: {
    createDocument: vi.fn(() => mockDocument)
  }
};

// Set ownerDocument reference
mockElement.ownerDocument = mockDocument;

// Mock DOMParser with proper BPMN parsing
global.DOMParser = class DOMParser {
  parseFromString(str: string, _type: string) {
    // Simple BPMN-aware parser for tests
    const isValidXML = !str.includes('<invalid>');
    
    if (!isValidXML) {
      return {
        querySelector: vi.fn(() => ({ textContent: 'Invalid XML' })),
        querySelectorAll: vi.fn(() => [])
      };
    }

    // Mock process element
    const mockProcess = {
      ...mockElement,
      getAttribute: vi.fn((attr: string) => {
        if (attr === 'id') return 'test-process';
        return null;
      }),
      querySelectorAll: vi.fn((selector: string) => {
        if (selector.includes('task')) {
          return [{
            ...mockElement,
            getAttribute: vi.fn((attr: string) => {
              switch (attr) {
                case 'id': return 'task1';
                case 'data-state-name': return 'created';
                case 'data-element-id': return 'task_created';
                default: return null;
              }
            })
          }];
        }
        if (selector.includes('endEvent')) {
          return [{
            ...mockElement,
            getAttribute: vi.fn((attr: string) => {
              switch (attr) {
                case 'id': return 'end1';
                case 'data-element-id': return 'end_completed';
                default: return null;
              }
            })
          }];
        }
        if (selector.includes('sequenceFlow')) {
          return [{
            ...mockElement,
            getAttribute: vi.fn((attr: string) => {
              switch (attr) {
                case 'id': return 'flow1';
                case 'sourceRef': return 'task1';
                case 'targetRef': return 'end1';
                case 'data-event': return 'COMPLETE';
                case 'data-flow-id': return 'flow_complete';
                default: return null;
              }
            })
          }];
        }
        return [];
      })
    };

    return {
      querySelector: vi.fn((selector: string) => {
        if (selector.includes('parsererror')) return null;
        if (selector.includes('process')) return mockProcess;
        return null;
      }),
      querySelectorAll: vi.fn(() => [])
    };
  }
};

global.XMLSerializer = class XMLSerializer {
  serializeToString(_doc: any) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="test-process">
    <bpmn:task id="task1" data-state-name="created" />
    <bpmn:endEvent id="end1" />
    <bpmn:sequenceFlow id="flow1" sourceRef="task1" targetRef="end1" data-event="COMPLETE" />
  </bpmn:process>
</bpmn:definitions>`;
  }
};

// Mock document for global access
Object.defineProperty(global, 'document', {
  writable: true,
  value: mockDocument
});
