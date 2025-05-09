import React from 'react';
import Graph from './components/Graph';
import './App.css';
import { ReactFlowProvider } from 'reactflow';

const App: React.FC = () => {
  // Download YAML as sample.yml
  const handleExport = (yamlString: string) => {
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerExport = () => {
    document.getElementById('hidden-export-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="graph-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 8px 24px', boxSizing: 'border-box' }}>
        <span className="graph-title" style={{ fontWeight: 'bold', fontSize: 24 }}>FAME YAML Visualizer</span>
        <div>
          <button className="graph-btn" style={{ marginRight: 8, backgroundColor: '#A3E635' }}>Add Action</button>
          <button className="graph-btn" style={{ backgroundColor: '#E5E7EB' }} onClick={triggerExport}>Export</button>
        </div>
      </header>
      <ReactFlowProvider>
        <main style={{ flex: 1, minHeight: 0 }}>
          <Graph onExport={handleExport} />
        </main>
      </ReactFlowProvider>
    </div>
  );
};

export default App;