import { ModeValueDisplay } from "./ModeValueDisplay";
import type { Variable } from "../../../types";

import {
  BugBeetle,
  HashStraight,
  Palette,
  PencilSimpleSlash,
  TextT,
  ToggleLeft,
} from "@phosphor-icons/react";
import { Tooltip } from "../../../components/ui";

/**
 * Props for the VariableRow component
 * @interface VariableRowProps
 * @property {Variable} variable - The variable data to display
 * @property {string[]} modes - List of available modes for the variable
 * @property {boolean} [hiddenFromPublishing] - Whether the variable is hidden from publishing
 */
interface VariableRowProps {
  variable: Variable;
  modes: string[];
  hiddenFromPublishing?: boolean;
}

/**
 * Resolves a variable's full path into its constituent parts
 * @param fullPath - The complete path of the variable (e.g. "colors/primary/500")
 * @returns {Object} Object containing the path parts
 * @property {string} groupPath - The path excluding the variable name
 * @property {string} displayName - The variable name without the path
 * @property {string} groupDisplayName - The immediate parent group name
 */
export function resolvePathParts(fullPath: string): {
  groupPath: string;
  displayName: string;
  groupDisplayName: string;
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

/**
 * Renders a table row for a single variable with its modes and metadata
 * @component
 * @param props - {@link VariableRowProps}
 */
export function VariableRow({
  variable,
  modes,
  hiddenFromPublishing,
}: VariableRowProps) {
  return (
    <tr className="hover:bg-figma-border/20">
      <td className="sticky left-0 z-30 p-3 pl-6 text-xs border border-figma-border bg-figma-bg flex items-center gap-2">
        {variable.type === "FLOAT" && <HashStraight size={14} />}
        {variable.type === "COLOR" && <Palette size={14} />}
        {variable.type === "STRING" && <TextT size={14} />}
        {variable.type === "BOOLEAN" && <ToggleLeft size={14} />}
        {!["FLOAT", "COLOR", "STRING", "BOOLEAN"].includes(variable.type) && (
          <BugBeetle size={14} />
        )}
        {resolvePathParts(variable.name).displayName}
        {(hiddenFromPublishing || variable.name.startsWith("_")) && (
          <Tooltip
            text="Hidden from publishing"
            trigger={
              <div className="ml-auto opacity-50">
                <PencilSimpleSlash size={14} />
              </div>
            }
          />
        )}
      </td>
      {modes.map((mode) => (
        <td
          key={mode}
          className="p-3 text-xs border border-figma-border bg-figma-bg"
        >
          <ModeValueDisplay modeValue={variable.modes[mode]} />
        </td>
      ))}
    </tr>
  );
}
