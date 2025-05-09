import React, { useEffect, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import yaml from 'js-yaml';
import dagre from 'dagre';
import CustomNode from './CustomNode';
import '../styles/Graph.css';

interface Action {
  action: string;
  name: string;
  dataframe: string;
  sql?: string;
  [key: string]: any;
}

interface GraphProps {
  onExport: (yamlString: string) => void;
}

const nodeTypes = { custom: CustomNode };
const EDGE_COLORS = [
  '#6366f1', '#e11d48', '#10b981', '#f59e42',
  '#3b82f6', '#a21caf', '#fbbf24', '#14b8a6',
];

async function fetchYamlActions(url: string): Promise<Action[]> {
  const res = await fetch(url);
  const parsed = yaml.load(await res.text()) as { actions: Action[] };
  if (!parsed.actions || !Array.isArray(parsed.actions)) throw new Error('Invalid YAML actions');
  return parsed.actions;
}

function buildNodeDependencies(actions: Action[]) {
  const dfToActions = new Map<string, Action[]>();
  actions.forEach(a => {
    if (!dfToActions.has(a.dataframe)) dfToActions.set(a.dataframe, []);
    dfToActions.get(a.dataframe)!.push(a);
  });
  const nodeDeps: Record<string, string[]> = {};
  actions.forEach(action => {
    const nodeId = `${action.dataframe}-${action.action}`;
    let deps: string[] = [];
    const sql = action.sql ?? '';
    deps = actions
      .filter(a => a.dataframe !== action.dataframe || a.action !== action.action)
      .filter(a => new RegExp(`\\b${a.dataframe}\\b`, 'gi').test(sql))
      .map(a => `${a.dataframe}-${a.action}`);
    if (action.action === 'LOAD') {
      const prev = dfToActions.get(action.dataframe)?.filter(a => a.action !== 'LOAD') || [];
      if (prev.length > 0) deps.push(`${prev[prev.length - 1].dataframe}-${prev[prev.length - 1].action}`);
    }
    nodeDeps[nodeId] = deps;
  });
  return nodeDeps;
}

function calculateNodeDepth(nodeDeps: Record<string, string[]>) {
  const nodeDepth: Record<string, number> = {};
  function getDepth(id: string): number {
    if (nodeDepth[id] !== undefined) return nodeDepth[id];
    if (!nodeDeps[id] || nodeDeps[id].length === 0) return (nodeDepth[id] = 0);
    return (nodeDepth[id] = 1 + Math.max(...nodeDeps[id].map(getDepth)));
  }
  Object.keys(nodeDeps).forEach(getDepth);
  return nodeDepth;
}

function buildNodesAndEdges(
  actions: Action[],
  nodeDeps: Record<string, string[]>,
  nodeDepth: Record<string, number>
) {
  const nodes: any[] = [];
  const edges: any[] = [];
  const yPos: Record<number, number> = {};
  const hSpace = 330, vSpace = 100;
  const nodeColorMap: Record<string, string> = {};
  let colorIdx = 0;
  Object.entries(nodeDeps).forEach(([id, deps]) => {
    const depth = nodeDepth[id];
    if (yPos[depth] === undefined) yPos[depth] = 0;
    const action = actions.find(a => `${a.dataframe}-${a.action}` === id);
    if (action && !nodeColorMap[action.dataframe]) {
      nodeColorMap[action.dataframe] = EDGE_COLORS[colorIdx % EDGE_COLORS.length];
      colorIdx++;
    }
    nodes.push({
      id,
      type: 'custom',
      data: {
        label: action?.name || id,
        type: action?.action,
        tooltip: action?.sql || action?.name,
        hasIncoming: deps.length > 0,
        hasOutgoing: Object.values(nodeDeps).some(d => d.includes(id)),
      },
      position: { x: depth * hSpace, y: yPos[depth] },
      sourcePosition: 'bottom',
      targetPosition: 'top',
    });
    yPos[depth] += vSpace;
    deps.forEach(dep => {
      const color = action ? nodeColorMap[action.dataframe] : '#6366f1';
      edges.push({
        id: `${dep}-${id}`,
        source: dep,
        target: id,
        style: { stroke: color, strokeWidth: 2, filter: 'drop-shadow(0 1px 2px #0002)' },
        markerEnd: { type: 'arrowclosed', color },
      });
    });
  });
  return { nodes, edges };
}

function applyDagreLayout(nodes: any[], edges: any[], nodeDepth: Record<string, number>) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', ranksep: 120, nodesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: 260, height: 110 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  nodes.forEach(n => {
    const pos = g.node(n.id);
    if (pos) n.position = { x: (nodeDepth[n.id] || 0) * 330, y: pos.y };
  });
}

function setNodeEdgeFlags(nodes: any[], edges: any[]) {
  const sources = new Set(edges.map(e => e.source));
  const targets = new Set(edges.map(e => e.target));
  nodes.forEach(n => {
    n.data.hasIncoming = targets.has(n.id);
    n.data.hasOutgoing = sources.has(n.id);
  });
}

const Graph: React.FC<GraphProps> = ({ onExport }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const actions = await fetchYamlActions('/sample.yml');
        setActions(actions);
        const nodeDeps = buildNodeDependencies(actions);
        const nodeDepth = calculateNodeDepth(nodeDeps);
        const { nodes, edges } = buildNodesAndEdges(actions, nodeDeps, nodeDepth);
        applyDagreLayout(nodes, edges, nodeDepth);
        setNodeEdgeFlags(nodes, edges);
        setNodes(nodes);
        setEdges(edges);
      } catch (err) {
        console.error('Error parsing YAML or building graph:', err);
      }
    })();
  }, []);

  const handleNodeClick = (_: any, node: any) => setSelectedNodeId(node.id);
  const handleExportClick = () => onExport(yaml.dump({ actions }));
  const selectedAction = selectedNodeId ? actions.find(a => `${a.dataframe}-${a.action}` === selectedNodeId) : null;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{ type: 'smoothstep' }}
        onNodeClick={handleNodeClick}
      >
        <MiniMap nodeColor={n => {
          if (n.data?.type === 'LOAD') return '#6EC1E4';
          if (n.data?.type === 'EXTRACT') return '#A3E635';
          if (n.data?.type === 'TRANSFORM') return '#FBBF24';
          return '#E5E7EB';
        }} />
        <Controls style={{ background: '#f3f4f6', borderRadius: 8 }} />
        <Background gap={18} size={1} color="#6366f1" />
      </ReactFlow>
      <button
        style={{ display: 'none' }}
        id="hidden-export-btn"
        onClick={handleExportClick}
      />
      {selectedAction && (
        <>
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9,
              background: 'transparent',
            }}
            onClick={() => setSelectedNodeId(null)}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              background: '#fff',
              borderTop: '1px solid #ddd',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
              padding: '20px 32px',
              maxHeight: '40vh',
              overflowY: 'auto',
              zIndex: 10,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{selectedAction.name} ({selectedAction.action})</h3>
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 15 }}>
              {JSON.stringify(selectedAction, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default Graph;