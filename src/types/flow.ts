import type { Node, Edge, XYPosition } from "@xyflow/react";

export interface FlowNode extends Omit<Node, "position"> {
  id: string;
  type: string;
  position?: XYPosition;
  data: {
    label: string;
    value?: string;
    description?: string;
    isExpanded?: boolean;
    childIds?: string[];
    onToggle?: (nodeId: string) => void;
  };
}

export interface FlowEdge extends Edge {
  data?: {
    type: "collection" | "reference" | "mode" | "variable";
  };
}

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
}
