// First create src/utils/groupUtils.ts
import type { Variable, NestedGroup } from "../types";

export function createNestedGroups(
  variables: Variable[]
): Map<string, NestedGroup> {
  const groups = new Map<string, NestedGroup>();

  variables.forEach((variable) => {
    if (!variable.name.includes("/")) return;

    const parts = variable.name.split("/");
    let currentMap = groups;
    let currentPath = "";

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

      const group = currentMap.get(part)!;
      if (i === parts.length - 2) {
        group.variables.push(variable);
      }

      currentMap = group.children;
    }
  });

  return groups;
}
