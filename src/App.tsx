import React from 'react';
import Graph from './components/Graph';
import './App.css';
import { ReactFlowProvider } from 'reactflow';

const App: React.FC = () => {
  return (
    <div className="App">
      <ReactFlowProvider>
        <div style={{ width: '100vw', height: '100vh' }}>
          <Graph />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default App;