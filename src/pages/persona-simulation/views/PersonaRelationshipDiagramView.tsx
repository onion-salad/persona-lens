import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import { type AIPersona } from '../page'; // Assuming page.tsx is one level up and exports AIPersona
import { calculatePersonaRelationships, type PersonaNodeData } from '../../../features/persona/utils/relationshipUtils';

interface PersonaRelationshipDiagramViewProps {
  personas: AIPersona[];
  onNodeClick?: (event: React.MouseEvent, node: Node<PersonaNodeData>) => void;
}

const PersonaRelationshipDiagramView: React.FC<PersonaRelationshipDiagramViewProps> = ({ personas, onNodeClick }) => {
  const { nodes, edges } = useMemo(() => {
    if (!personas || personas.length === 0) {
      return { nodes: [], edges: [] };
    }
    // You can adjust the commonKeywordThreshold as needed
    return calculatePersonaRelationships(personas, 2);
  }, [personas]);

  if (!personas || personas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        関係図を表示するペルソナがいません。
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', background: '#f7f7f7' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick} // Pass down the onNodeClick handler
        fitView
        attributionPosition="bottom-left"
        nodesDraggable
        edgesFocusable
      >
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} nodeColor={(n) => '#007bff'} pannable zoomable />
      </ReactFlow>
    </div>
  );
};

export default PersonaRelationshipDiagramView; 