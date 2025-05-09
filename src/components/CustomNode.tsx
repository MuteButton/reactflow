import React from 'react';
import { Handle, Position } from 'reactflow';

const typeColors: Record<string, string> = {
    LOAD: '#6EC1E4',
    EXTRACT: '#A3E635',
    TRANSFORM: '#FBBF24',
    DEFAULT: '#E5E7EB',
};

const typeIcons: Record<string, string> = {
    LOAD: '⬇️',
    EXTRACT: '📤',
    TRANSFORM: '🔄',
    DEFAULT: '📦',
};

interface CustomNodeProps {
    data: {
        label: string;
        type?: string;
        tooltip?: string;
        hasIncoming?: boolean;
        hasOutgoing?: boolean;
    };
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
    const color = typeColors[data.type || 'DEFAULT'] || typeColors.DEFAULT;
    const icon = typeIcons[data.type || 'DEFAULT'] || typeIcons.DEFAULT;
    return (
        <div className="custom-node" style={{ background: color }} title={data.tooltip || data.label}>
            <span className="custom-node-icon">{icon}</span>
            <span className="custom-node-label">{data.label}</span>
            {/* Incoming handle on the left */}
            {data.hasIncoming && <Handle type="target" position={Position.Left} />}
            {/* Outgoing handle on the right */}
            {data.hasOutgoing && <Handle type="source" position={Position.Right} />}
        </div>
    );
};

export default CustomNode;
