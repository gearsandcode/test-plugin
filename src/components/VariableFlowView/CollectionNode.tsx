import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface CollectionNodeProps extends NodeProps {
  data: {
    label: string;
    value: string;
    description: string;
    isExpanded: boolean;
    id: string;
    onToggle?: (nodeId: string) => void;
  };
}

export const CollectionNode = ({
  isConnectable,
  data,
}: CollectionNodeProps) => {
  return (
    <div className="collection-node">
      <button
        onClick={() => data.onToggle?.(data.id)}
        className="flex items-center gap-2"
      >
        {data.isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
        <p>{data.label}</p>
      </button>
      <div>
        <p>{data.label}</p>
        <p>{data.value}</p>
        <p>{data.description}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="collection-node"
        isConnectable={isConnectable}
      />
    </div>
  );
};
