import {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  NodeTypes,
  applyNodeChanges,
  applyEdgeChanges,
  Edge,
  EdgeChange,
  Node,
  Panel,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  addEdge,
  XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles.css"; // Import the custom CSS for dark mode
import { FormattedCollection } from "../../types";
import { FlowNode, FlowEdge, FlowData } from "../../types/flow";
import { CollectionNode } from "./CollectionNode";
import { ModeNode } from "./ModeNode";
import { VariableNode } from "./VariableNode";
import { useCallback, useState } from "react";
import dagre from "@dagrejs/dagre";

import "@xyflow/react/dist/style.css";

import { initialNodes, initialEdges } from "./initialElements";

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

// Define proper node types mapping
const nodeTypes: NodeTypes = {
  variableNode: VariableNode,
  collectionNode: CollectionNode,
  modeNode: ModeNode,
} as const;

const getLayoutedElements = (nodes: any[], edges: any[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges
);

export const Flow = ({
  collections,
}: {
  collections: FormattedCollection[];
}) => {
  const flowData = createLayoutFlowData(collections);
  // Initialize state with flowData
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge(
          { ...params, type: ConnectionLineType.SmoothStep, animated: true },
          eds
        )
      ),
    []
  );
  const onLayout = useCallback(
    (direction: string | undefined) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      connectionLineType={ConnectionLineType.SmoothStep}
      nodeTypes={nodeTypes}
      fitView
      style={{ backgroundColor: "#F7F9FB" }}
    >
      <Panel position="top-right">
        <button onClick={() => onLayout("TB")}>vertical layout</button>
        <button onClick={() => onLayout("LR")}>horizontal layout</button>
      </Panel>
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};

function createLayoutFlowData(collections: any, direction = "TB"): FlowData {
  // const nodes: Node[] = [];
  const edges: Edge[] = [];

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  let yOffset = 0;

  collections.forEach((collection: { variables: any; id: string }) => {
    dagreGraph.setNode(collection.id, { width: nodeWidth, height: nodeHeight });

    collection.variables.forEach(
      (variable: {
        id: any;
        source: dagre.Edge;
        target: string | { [key: string]: any } | undefined;
      }) => {
        console.log(variable);

        // collection.variables.forEach((variable: { id: string }) => {
        edges.push({
          id: `edge-${collection.id}-${variable.id}`,
          source: collection.id,
          target: variable.id,
          type: "smoothstep",
          animated: true,
        });
        // });
        dagreGraph.setEdge(variable.source, variable.target);
      }
    );
  });

  dagre.layout(dagreGraph);

  const newNodes = collections.map((node: { id: string | dagre.Label }) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
}

function createFlowData(collections: any): FlowData {
  const nodes: Node[] = [];
  const edges: FlowEdge[] = [];
  let yOffset = 0;

  // Create nodes and initial edges
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    const collectionId = "collection-" + i;

    // Add collection node
    nodes.push({
      id: collectionId,
      type: "collectionNode",
      position: { x: 0, y: yOffset },
      data: { label: collection.name },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Get unique modes from all variables in collection
    const modes = new Set<string>();
    collection.variables.forEach((variable: { modes: {} }) => {
      if (variable.modes) {
        Object.keys(variable.modes).forEach((mode) => modes.add(mode));
      }
    });

    // Update mode nodes to have left and right handles
    const modeNodes = Array.from(modes).map((mode, index) => {
      const modeId = `${collectionId}-mode-${mode}`;
      nodes.push({
        id: modeId,
        type: "modeNode",
        position: { x: 250, y: yOffset + index * 100 },
        data: { label: mode },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Update edge to specify handles
      edges.push({
        id: `${collectionId}-${modeId}`,
        source: collectionId,
        target: modeId,
        type: "smoothstep",
      });

      return modeId;
    });

    // Add variable nodes and connect to appropriate modes
    collection.variables.forEach(
      (
        variable: {
          id: any;
          name: string;
          value: string;
          modes: { [key: string]: any };
        },
        j: number
      ) => {
        const varId = variable.id;
        const xOffset = 400;

        // Connect variable to its modes
        if (variable.modes) {
          Object.keys(variable.modes).forEach((mode) => {
            nodes.push({
              id: varId,
              type: "variableNode",
              position: { x: xOffset, y: yOffset + j * 100 },
              data: {
                label: variable.name,
                value:
                  typeof variable.modes[mode].value === "string"
                    ? variable.modes[mode].value
                    : JSON.stringify(variable.modes[mode].value),
              },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
              draggable: true, // Add this property
            });

            const modeId = `${collectionId}-mode-${mode}`;
            edges.push({
              id: `${modeId}-${varId}`,
              source: modeId,
              target: varId,
              type: "smoothstep",
              data: { type: "variable" },
            });
          });
        }
      }
    );

    yOffset += Math.max(collection.variables.length * 50, modes.size * 50);
  }

  return { nodes, edges };
}

// Example usage in a component
export const VariableFlowView = ({
  collections,
}: {
  collections: FormattedCollection[];
}) => {
  const flowData = createFlowData(collections);
  // Initialize state with flowData
  const [nodes, setNodes] = useState<Node[]>(() => flowData.nodes);
  const [edges, setEdges] = useState<Edge[]>(flowData.edges);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds: Node[]) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes} // Use nodes state instead of flowData.nodes
      edges={edges} // Use edges state instead of flowData.edges
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
