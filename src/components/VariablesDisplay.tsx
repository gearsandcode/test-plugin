/**
 * @fileoverview VariablesDisplay using Figma's clientStorage
 */
import { useState, useEffect, useMemo } from "react";
import { VariablesCard, type Variable } from "./VariablesCard";
import {
  PaintBrush,
  CaretDown,
  CaretRight,
  MinusSquare,
  PlusSquare,
} from "@phosphor-icons/react";

export interface VariableCollection {
  name: string;
  variables: Variable[];
}

interface VariableGroup {
  name: string;
  variables: Variable[];
  isOpen: boolean;
}

interface VariablesDisplayProps {
  variables: VariableCollection[];
  loading?: boolean;
}

// Storage key for group states
const STORAGE_KEY = "variable-groups-state";

export function VariablesDisplay({
  variables,
  loading,
}: VariablesDisplayProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [groups, setGroups] = useState<Map<string, VariableGroup>>(new Map());

  // Load saved states from Figma storage
  const loadGroupStates = async (collectionName: string) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "load-group-states",
          key: `${STORAGE_KEY}-${collectionName}`,
        },
      },
      "*"
    );
  };

  // Save states to Figma storage
  const saveGroupStates = async (
    collectionName: string,
    states: Record<string, boolean>
  ) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-group-states",
          key: `${STORAGE_KEY}-${collectionName}`,
          states,
        },
      },
      "*"
    );
  };

  // Listen for messages from the plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === "group-states-loaded") {
        const savedStates = msg.states || {};
        setGroups((prev) => {
          const newGroups = new Map(prev);
          for (const [groupName, group] of newGroups.entries()) {
            newGroups.set(groupName, {
              ...group,
              isOpen: savedStates[groupName] ?? true,
            });
          }
          return newGroups;
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Group variables by base name (before first "/")
  const groupedVariables = useMemo(() => {
    if (!selectedCollection) return new Map<string, VariableGroup>();

    const currentVariables =
      variables.find((v) => v.name === selectedCollection)?.variables || [];
    const groups = new Map<string, VariableGroup>();

    currentVariables.forEach((variable) => {
      const baseName = variable.name.split("/")[0];
      if (!groups.has(baseName)) {
        groups.set(baseName, {
          name: baseName,
          variables: [],
          isOpen: true, // Default state, will be updated when storage loads
        });
      }
      groups.get(baseName)?.variables.push(variable);
    });

    return groups;
  }, [selectedCollection, variables]);

  // Set initial collection and load saved states
  useEffect(() => {
    if (variables.length > 0 && !selectedCollection) {
      const initialCollection = variables[0].name;
      setSelectedCollection(initialCollection);
      loadGroupStates(initialCollection);
    }
  }, [variables]);

  // Update groups when variables change
  useEffect(() => {
    setGroups(groupedVariables);
  }, [groupedVariables]);

  const toggleGroup = (groupName: string) => {
    setGroups((prev) => {
      const newGroups = new Map(prev);
      const group = newGroups.get(groupName);
      if (group) {
        const newState = !group.isOpen;
        newGroups.set(groupName, { ...group, isOpen: newState });

        // Save all group states
        const states = Array.from(newGroups.entries()).reduce(
          (acc, [name, group]) => ({
            ...acc,
            [name]: group.isOpen,
          }),
          {}
        );
        saveGroupStates(selectedCollection, states);
      }
      return newGroups;
    });
  };

  const handleCollectionChange = (collectionName: string) => {
    setSelectedCollection(collectionName);
    loadGroupStates(collectionName);
  };

  const handleExpandAll = () => {
    setGroups((prev) => {
      const newGroups = new Map(prev);
      for (const [groupName, group] of newGroups.entries()) {
        newGroups.set(groupName, { ...group, isOpen: true });
      }

      // Save expanded states
      const states = Array.from(newGroups.entries()).reduce(
        (acc, [name]) => ({
          ...acc,
          [name]: true,
        }),
        {}
      );
      saveGroupStates(selectedCollection, states);

      return newGroups;
    });
  };

  const handleCollapseAll = () => {
    setGroups((prev) => {
      const newGroups = new Map(prev);
      for (const [groupName, group] of newGroups.entries()) {
        newGroups.set(groupName, { ...group, isOpen: false });
      }

      // Save collapsed states
      const states = Array.from(newGroups.entries()).reduce(
        (acc, [name]) => ({
          ...acc,
          [name]: false,
        }),
        {}
      );
      saveGroupStates(selectedCollection, states);

      return newGroups;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <PaintBrush size={24} className="opacity-50" />
        </div>
      </div>
    );
  }

  const hasGroups = groups.size > 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header with expand/collapse controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Design Variables</h2>
        {hasGroups && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5 rounded-sm"
              title="Expand all groups"
            >
              <PlusSquare size={14} />
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5 rounded-sm"
              title="Collapse all groups"
            >
              <MinusSquare size={14} />
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Collection tabs */}
      <div className="flex space-x-2 border-b border-black/10 dark:border-white/10">
        {variables.map(({ name }) => (
          <button
            key={name}
            onClick={() => handleCollectionChange(name)}
            className={`
              px-3 py-1.5 text-xs transition-all
              ${
                selectedCollection === name
                  ? "border-b-2 border-black dark:border-white -mb-px"
                  : "opacity-60 hover:opacity-80"
              }
            `}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Variables grid */}
      <div className="space-y-4">
        {hasGroups ? (
          Array.from(groups.entries()).map(([groupName, group]) => (
            <div key={groupName} className="space-y-2">
              <button
                onClick={() => toggleGroup(groupName)}
                className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
              >
                {group.isOpen ? (
                  <CaretDown size={16} />
                ) : (
                  <CaretRight size={16} />
                )}
                {groupName}
                <span className="text-xs opacity-50">
                  ({group.variables.length})
                </span>
              </button>

              {group.isOpen && (
                <div className="grid gap-2 pl-6">
                  {group.variables.map((variable, i) => (
                    <VariablesCard
                      key={`${variable.name}-${i}`}
                      variable={variable}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm opacity-50">
            No variables found in this collection.
          </div>
        )}
      </div>
    </div>
  );
}
