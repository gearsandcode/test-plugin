import { ArrowClockwise, CaretRight } from "@phosphor-icons/react";
import type { NestedGroup, Variable, VariableCollection } from "../../types";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "../Alert";
import { VariablesTable } from "./components/VariablesTable";

interface Props {
  variables: VariableCollection[];
  loading?: boolean;
  onRefresh: () => void;
}

function getRootVariables(variables: Variable[]): Variable[] {
  return variables.filter((v) => !v.name.includes("/"));
}

/**
 * Gets the relevant display path for a variable based on group context
 * @param fullPath - Full variable path
 * @param selectedGroup - Currently selected group path (if any)
 * @returns Resolved display path
 */
function getRelevantPath(
  fullPath: string,
  selectedGroup: string | null
): string {
  const parts = fullPath.split("/");

  if (!selectedGroup) {
    // In "All variables" view, show up to the second-to-last segment
    return parts.slice(0, -1).join("/");
  }

  // When a group is selected, show the last segment of that group
  const groupParts = selectedGroup.split("/");
  const relevantParts = parts.slice(groupParts.length);
  return relevantParts[0] || parts[parts.length - 1];
}

/**
 * Resolves group display name based on context
 */
function getGroupDisplayName(fullPath: string): string {
  const parts = fullPath.split("/");
  return parts[parts.length - 1];
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

function createNestedGroups(variables: Variable[]): Map<string, NestedGroup> {
  const groups = new Map<string, NestedGroup>();

  variables.forEach((variable) => {
    if (!variable.name.includes("/")) return;

    const parts = variable.name.split("/");
    let currentMap = groups;
    let currentPath = "";

    // Process each part of the path except the last one (which is the variable name)
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!currentMap.has(part)) {
        currentMap.set(part, {
          name: part,
          fullPath: currentPath,
          variables: [],
          children: new Map(),
          isOpen: true,
        });
      }

      // Add variable to the appropriate group level
      const group = currentMap.get(part)!;
      if (i === parts.length - 2) {
        group.variables.push(variable);
      }

      currentMap = group.children;
    }
  });

  return groups;
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

export function VariablesTableView({
  variables,
  loading = false,
  onRefresh,
}: Props) {
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Map<string, NestedGroup>>(new Map());

  // Set initial collection when component mounts
  useEffect(() => {
    if (variables.length > 0) {
      setSelectedCollection(variables[0].name);
    }
  }, [variables]); // Only depends on variables array

  const currentCollection = useMemo(
    () => variables.find((v) => v.name === selectedCollection),
    [selectedCollection, variables]
  );

  // Initialize groups whenever collection changes
  useEffect(() => {
    if (currentCollection?.variables) {
      const newGroups = createNestedGroups(currentCollection.variables);
      setGroups(newGroups);
      console.log("Initializing groups:", {
        collection: currentCollection.name,
        variables: currentCollection.variables.length,
        groups: newGroups.size,
      });
    }
  }, [currentCollection]);

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
    setGroups((prevGroups) => {
      const newGroups = new Map(prevGroups);
      const group = findGroupByPath(path);
      if (group) {
        group.isOpen = !group.isOpen;
      }
      return newGroups;
    });
  };

  // Get variables for selected group
  const selectedGroupVariables = useMemo(() => {
    if (!selectedGroup) return [];
    return findGroupByPath(selectedGroup)?.variables || [];
  }, [selectedGroup, groups]);

  const totalVariablesCount = useMemo(
    () => currentCollection?.variables.length || 0,
    [currentCollection?.variables]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert
          type="loading"
          message={
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-stone-300 border-t-stone-600" />
              <span className="text-xs opacity-80">
                Getting new variables...
              </span>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-figma-bg pb-4">
      {/* Sidebar */}
      <div className="w-64 border-r border-figma-border p-4 pt-1 mt-2 space-y-4 overflow-auto">
        <div>
          <div className="flex items-center justify-between mb-2 pt-2">
            <label className="text-xs font-medium">Collection</label>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded hover:bg-figma-border/50 text-figma-text-secondary transition-colors"
              title="Refresh variables"
            >
              <ArrowClockwise
                size={14}
                className={loading ? "animate-spin" : ""}
                weight="bold"
              />
            </button>
          </div>
          <select
            value={selectedCollection}
            onChange={(e) => {
              setSelectedCollection(e.target.value);
              setSelectedGroup(null);
            }}
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
              onClick={() => setSelectedGroup(null)}
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
                onGroupSelect={setSelectedGroup}
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
          />
        )}
      </div>
    </div>
  );
}
