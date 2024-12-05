import { ModeValueDisplay } from "./ModeValueDisplay";
import type { Variable } from "../../../types";

interface VariableRowProps {
  variable: Variable;
  modes: string[];
}

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

export function VariableRow({ variable, modes }: VariableRowProps) {
  return (
    <tr className="hover:bg-figma-border/20">
      <td className="sticky left-0 z-30 p-3 pl-6 text-xs border border-figma-border bg-figma-bg">
        {resolvePathParts(variable.name).displayName}
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
