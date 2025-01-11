import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface ModeNodeProps extends NodeProps {
  data: { label: string; value: string; description: string };
}

export const ModeNode = ({ isConnectable, data }: ModeNodeProps) => {
  return (
    <div className="mode-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <div>
        <p>{data.label}</p>
        <p>{data.description}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="mode-node"
        isConnectable={isConnectable}
      />
    </div>
  );
};
