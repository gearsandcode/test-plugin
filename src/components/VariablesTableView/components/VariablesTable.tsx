import { VariablesGroupHeader } from "./VariablesGroupHeader";
import { VariableRow } from "./VariablesGroupRow";
import type { Variable, VariableCollection } from "../../../types";

interface VariablesTableProps {
  collection: VariableCollection;
  selectedGroup: string | null;
  groupedVariables: Map<string, Variable[]>;
  rootVariables: Variable[];
  selectedGroupVariables: Variable[];
}

export function VariablesTable({
  collection,
  selectedGroup,
  groupedVariables,
  rootVariables,
  selectedGroupVariables,
}: VariablesTableProps) {
  return (
    <table className="w-full border-separate border-spacing-0">
      <thead>
        <tr>
          <th className="sticky top-0 left-0 z-50 p-3 pt-6 text-xs font-normal border border-figma-border w-[200px] min-w-[160px] bg-figma-bg text-left">
            Name
          </th>
          {collection.modes.map((mode) => (
            <th
              key={mode}
              className="sticky top-0 z-40 p-3 pt-6 text-xs font-normal border border-figma-border w-[200px] min-w-[160px] bg-figma-bg text-left"
            >
              {mode}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!selectedGroup && (
          <>
            {rootVariables.map((variable) => (
              <VariableRow
                key={variable.name}
                variable={variable}
                modes={collection.modes}
              />
            ))}
            {Array.from(groupedVariables.entries()).map(([groupPath, vars]) => (
              <>
                <VariablesGroupHeader
                  key={`header-${groupPath}`}
                  groupPath={groupPath}
                  modesCount={collection.modes.length}
                />
                {vars.map((variable) => (
                  <VariableRow
                    key={variable.name}
                    hiddenFromPublishing={
                      variable.hiddenFromPublishing ||
                      collection.name.startsWith("_")
                    }
                    variable={variable}
                    modes={collection.modes}
                  />
                ))}
              </>
            ))}
          </>
        )}
        {selectedGroup && selectedGroupVariables.length > 0 && (
          <>
            <VariablesGroupHeader
              groupPath={selectedGroup}
              modesCount={collection.modes.length}
            />
            {selectedGroupVariables.map((variable) => (
              <VariableRow
                key={variable.name}
                hiddenFromPublishing={
                  variable.hiddenFromPublishing ||
                  collection.name.startsWith("_")
                }
                variable={variable}
                modes={collection.modes}
              />
            ))}
          </>
        )}
      </tbody>
    </table>
  );
}
