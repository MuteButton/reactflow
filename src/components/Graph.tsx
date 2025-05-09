import React, { useState, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    data: { label: 'Node 1' },
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    data: { label: 'Node 3' },
    position: { x: 400, y: 100 },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    animated: true,
  },
];

const Graph: React.FC = () => {
  const [nodes] = useState(initialNodes);
  const [edges] = useState(initialEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    fitView({ padding: 0.1 });
  }, [fitView]);

  return (
    <ReactFlowProvider>
      <div style={{ height: '100vh' }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default Graph;