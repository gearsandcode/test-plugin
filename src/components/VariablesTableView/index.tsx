import { CaretRight } from "@phosphor-icons/react";
import type { NestedGroup, Variable, VariableCollection } from "../../types";
import { useEffect, useMemo, useState } from "react";

import { VariablesTable } from "./components/VariablesTable";
import { createNestedGroups } from "../../utils";

interface VariablesTableViewProps {
  variables: VariableCollection[];
  selectedCollection: string;
  selectedGroup: string | null;
  onCollectionChange: (collection: string) => void;
  onGroupChange: (group: string | null) => void;
  view: "list" | "flow";
  onViewChange: (view: "list" | "flow") => void;
}

function getRootVariables(variables: Variable[]): Variable[] {
  return variables.filter((v) => !v.name.includes("/"));
}

/**
 * Gets the group path and display name for a variable
 * @param fullPath - Full variable path (e.g., "background/page/default")
 * @returns Object containing group path and display name
 */
function resolvePathParts(fullPath: string): {
  groupPath: string; // The path up to the parent group
  displayName: string; // The last segment
  groupDisplayName: string; // The immediate parent group name
} {
  const parts = fullPath.split("/");
  const displayName = parts[parts.length - 1];
  const groupPath = parts.slice(0, -1).join("/");
  const groupDisplayName = parts[parts.length - 2] || groupPath;

  return {
    groupPath,
    displayName,
    groupDisplayName,
  };
}

function SidebarGroup({
  group,
  level = 0,
  selectedGroup,
  onGroupSelect,
  onToggleGroup,
}: {
  group: NestedGroup;
  level?: number;
  selectedGroup: string | null;
  onGroupSelect: (path: string) => void;
  onToggleGroup: (path: string) => void;
}) {
  const hasChildren = group.children.size > 0;
  const isSelected = selectedGroup === group.fullPath;

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          if (hasChildren) {
            onToggleGroup(group.fullPath);
          }
          onGroupSelect(group.fullPath);
        }}
        className={`
          w-full text-left px-2 py-1.5 text-xs rounded-sm
          hover:bg-figma-border/50
          ${isSelected ? "bg-figma-bg-secondary" : ""}
          ${level > 0 ? "ml-4" : ""}
        `}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <CaretRight
              size={12}
              className={`flex-shrink-0 transition-transform ${
                group.isOpen ? "transform rotate-90" : ""
              }`}
            />
          )}
          <span className="truncate">{group.name}</span>
          <span className="text-figma-text-secondary ml-auto">
            {group.variables.length}
          </span>
        </div>
      </button>

      {group.isOpen && hasChildren && (
        <div className="space-y-1">
          {Array.from(group.children.values()).map((childGroup) => (
            <SidebarGroup
              key={childGroup.fullPath}
              group={childGroup}
              level={level + 1}
              selectedGroup={selectedGroup}
              onGroupSelect={onGroupSelect}
              onToggleGroup={onToggleGroup}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Add this helper function near the other utility functions at the top
function getGroupVariables(group: NestedGroup | null): Variable[] {
  if (!group) return [];
  return group.variables;
}

function getModes(collection: any) {
  if (!collection) return [];
  // Handle modes as object
  if (
    collection.modes &&
    typeof collection.modes === "object" &&
    !Array.isArray(collection.modes)
  ) {
    return Object.keys(collection.modes);
  }
  // Handle modes as array
  if (Array.isArray(collection.modes)) {
    return collection.modes;
  }
  return [];
}

export function VariablesTableView({
  variables,
  selectedCollection,
  selectedGroup,
  onCollectionChange,
  onGroupChange,
}: VariablesTableViewProps) {
  // const [selectedCollection, setSelectedCollection] = useState<string>("");
  // const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Map<string, NestedGroup>>(new Map());

  // // Set initial collection when component mounts
  // useEffect(() => {
  //   if (variables.length > 0) {
  //     setSelectedCollection(variables[0].name);
  //   }
  // }, [variables]); // Only depends on variables array

  const currentCollection = useMemo(() => {
    if (!variables || !selectedCollection) return null;
    return variables.find((v) => v.name === selectedCollection) || null;
  }, [selectedCollection, variables]);

  // Set initial collection when none is selected
  useEffect(() => {
    if (variables.length > 0 && !selectedCollection) {
      onCollectionChange(variables[0].name);
    }
  }, [variables, selectedCollection, onCollectionChange]);

  // Initialize groups whenever collection changes
  useEffect(() => {
    if (currentCollection?.variables) {
      setGroups(createNestedGroups(currentCollection.variables));
    }
  }, [currentCollection]);

  const modes = useMemo(() => {
    return getModes(currentCollection);
  }, [currentCollection]);

  // Update select handler to use prop
  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCollectionChange(e.target.value);
    onGroupChange(null); // Reset group when collection changes
  };

  const groupedVariables = useMemo(() => {
    if (!currentCollection?.variables) return new Map<string, Variable[]>();

    return currentCollection.variables
      .filter((v) => v.name.includes("/"))
      .reduce((acc, variable) => {
        const { groupPath } = resolvePathParts(variable.name);
        if (!acc.has(groupPath)) {
          acc.set(groupPath, []);
        }
        acc.get(groupPath)!.push(variable);
        return acc;
      }, new Map<string, Variable[]>());
  }, [currentCollection?.variables]);

  const rootVariables = useMemo(
    () => getRootVariables(currentCollection?.variables || []),
    [currentCollection?.variables]
  );

  // Initialize nested groups when collection changes
  useEffect(() => {
    if (currentCollection?.variables) {
      setGroups(createNestedGroups(currentCollection.variables));
    }
  }, [currentCollection?.variables]);

  // Function to find a group by its full path
  const findGroupByPath = (path: string): NestedGroup | null => {
    const parts = path.split("/");
    let currentMap = groups;
    let currentGroup: NestedGroup | null = null;

    for (const part of parts) {
      currentGroup = currentMap.get(part) || null;
      if (!currentGroup) break;
      currentMap = currentGroup.children;
    }

    return currentGroup;
  };

  const handleToggleGroup = (path: string) => {
    const newGroups = new Map();
    groups.forEach((value, key) => {
      newGroups.set(key, value);
    });

    const group = findGroupByPath(path, newGroups);
    if (group) {
      group.isOpen = !group.isOpen;
      setGroups(newGroups);
    }
  };

  // Get variables for selected group
  const selectedGroupVariables = useMemo(() => {
    if (!selectedGroup) return [];
    const group = findGroupByPath(selectedGroup, groups);
    return getGroupVariables(group);
  }, [selectedGroup, groups]);

  return (
    <div className="flex h-full bg-figma-bg pb-4">
      {/* Sidebar */}
      <div className="w-64 border-r border-figma-border p-4 pt-1 mt-2 space-y-4 overflow-auto">
        <div>
          <div className="flex items-center justify-between mb-2 pt-2">
            <label className="text-xs font-medium">Collection</label>
          </div>
          <select
            value={selectedCollection}
            onChange={handleCollectionChange}
            className="w-full px-2 py-1.5 text-xs rounded-sm border border-figma-border"
          >
            {variables.map((collection) => (
              <option key={collection.name} value={collection.name}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium block mb-2">Groups</label>
          <div className="space-y-1">
            <button
              onClick={() => onGroupChange(null)}
              className={`
                w-full text-left px-2 py-1.5 text-xs rounded-sm
                hover:bg-figma-border/50
                ${!selectedGroup ? "bg-figma-bg-secondary" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <span>All variables</span>
                <span className="text-figma-text-secondary">
                  {currentCollection?.variables?.length || 0}
                </span>
              </div>
            </button>
            {Array.from(groups.values()).map((group) => (
              <SidebarGroup
                key={group.fullPath}
                group={group}
                selectedGroup={selectedGroup}
                onGroupSelect={onGroupChange}
                onToggleGroup={handleToggleGroup}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {currentCollection && (
          <VariablesTable
            collection={currentCollection}
            selectedGroup={selectedGroup}
            groupedVariables={groupedVariables}
            rootVariables={rootVariables}
            selectedGroupVariables={selectedGroupVariables}
            modes={modes}
          />
        )}
      </div>
    </div>
  );
}
