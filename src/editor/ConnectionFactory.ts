/**
 * Custom connection factory that ensures all connections have proper types
 */

function CustomConnectionFactory(elementFactory: any) {
  this._elementFactory = elementFactory;
}

CustomConnectionFactory.$inject = ['elementFactory'];

CustomConnectionFactory.prototype.createConnection = function(attrs: any) {
  // Ensure all connections are SequenceFlows
  const connectionAttrs = {
    type: 'bpmn:SequenceFlow',
    ...attrs
  };
  
  return this._elementFactory.createConnection(connectionAttrs);
};

// Export as a module for bpmn-js
export default {
  __init__: [],
  connectionFactory: ['type', CustomConnectionFactory]
};
