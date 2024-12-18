import { useCallback } from "react";
import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles.css"; // Import the custom CSS for dark mode
import { FormattedCollection } from "../../types";
import { FlowNode, FlowEdge, FlowData } from "../../types/flow";
import { VariableNode } from "./VariableNode";

function createFlowData(collections: any): FlowData {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const nameToIdMap: Record<string, string> = {};
  let yOffset = 0;

  // Create nodes and initial edges
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    const collectionId = "collection-" + i;

    // Add collection node
    nodes.push({
      id: collectionId,
      type: "variableNode",
      position: { x: 0, y: yOffset },
      data: { label: collection.name },
    });

    // Get unique modes from all variables in collection
    const modes = new Set<string>();
    collection.variables.forEach((variable: { modes: {} }) => {
      if (variable.modes) {
        Object.keys(variable.modes).forEach((mode) => modes.add(mode));
      }
    });

    // Create mode nodes
    const modeNodes = Array.from(modes).map((mode, index) => {
      const modeId = `${collectionId}-mode-${mode}`;
      nodes.push({
        id: modeId,
        type: "variableNode",
        position: { x: 250, y: yOffset + index * 100 },
        data: { label: mode },
      });

      // Connect collection to mode
      edges.push({
        id: `${collectionId}-${modeId}`,
        source: collectionId,
        target: modeId,
        type: "smoothstep",
        data: { type: "mode" },
      });

      return modeId;
    });

    // Add variable nodes and connect to appropriate modes
    collection.variables.forEach(
      (variable: { id: any; name: string | number; modes: {} }, j: number) => {
        const varId = variable.id;
        const xOffset = 500;

        nodes.push({
          id: varId,
          type: "variableNode",
          position: { x: xOffset, y: yOffset + j * 100 },
          data: { label: String(variable.name) },
        });

        nameToIdMap[variable.name] = varId;

        // Connect variable to its modes
        if (variable.modes) {
          Object.keys(variable.modes).forEach((mode) => {
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

    yOffset += Math.max(collection.variables.length * 100, modes.size * 100);
  }

  return { nodes, edges };
}

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = { variableNode: VariableNode };

// Example usage in a component
export const VariableFlowView = ({
  collections,
}: {
  collections: FormattedCollection[];
}) => {
  const flowData = createFlowData(collections);

  return (
    <ReactFlow
      nodes={flowData.nodes}
      edges={flowData.edges}
      nodeTypes={nodeTypes}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
