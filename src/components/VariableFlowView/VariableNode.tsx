import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface VariableNodeProps extends NodeProps {
  data: { label: string; description: string; value: string };
}

export const VariableNode = ({ isConnectable, data }: VariableNodeProps) => {
  return (
    <div className="variable-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <div>
        <p>{data.label}</p>
        <p>{data.value}</p>
        <p>{data.description}</p>
      </div>
    </div>
  );
};
