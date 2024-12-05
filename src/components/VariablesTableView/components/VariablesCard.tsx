import { useState } from "react";
import { copyToClipboard } from "../utils";
import {
  Copy,
  NumberOne,
  TextT,
  ToggleLeft,
  Code,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { ModeValue, Variable } from "../types";

interface VariableCardProps {
  variable: Variable;
  selectedModes: ModeValue[];
}

type VariableType =
  | "FLOAT"
  | "STRING"
  | "BOOLEAN"
  | "COLOR"
  | "VARIABLE_ALIAS"
  | "DEFAULT";

const TYPE_ICONS: Record<VariableType, typeof NumberOne | null> = {
  FLOAT: NumberOne,
  STRING: TextT,
  BOOLEAN: ToggleLeft,
  COLOR: null,
  VARIABLE_ALIAS: ArrowsClockwise,
  DEFAULT: Code,
};

export function VariablesCard({ variable, selectedModes }: VariableCardProps) {
  const { name, type, description, modes } = variable;
  const [copied, setCopied] = useState(false);

  const handleCopy = async (value: string) => {
    const copyValue = `${name}: ${value}`;
    try {
      await copyToClipboard(copyValue);
      parent.postMessage(
        {
          pluginMessage: {
            type: "notify",
            message: `Copied "${copyValue}" to clipboard!`,
          },
        },
        "*"
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      parent.postMessage(
        {
          pluginMessage: {
            type: "notify",
            message: "Failed to copy to clipboard",
            error: true,
          },
        },
        "*"
      );
    }
  };

  const IconComponent = TYPE_ICONS[type as VariableType] || TYPE_ICONS.DEFAULT;

  // Object.entries(modes).map(([mode, variable]) => {
  //   const { displayValue, value, resolvedValue, resolvedName, type } = variable;
  //   console.log({
  //     mode,
  //     displayValue,
  //     value,
  //     resolvedValue,
  //     resolvedName,
  //     type,
  //   });
  // });

  return (
    <div className="flex items-start space-x-3 p-3 rounded-sm border border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
      {Object.entries(modes).map(([modeName, variable]) => (
        <div key={variable.value}>
          <div className="flex-shrink-0">
            {modeName && <div>{modeName}</div>}
            {type === "COLOR" ? (
              <div
                className="w-8 h-8 rounded-sm shadow-sm"
                style={{
                  backgroundColor:
                    variable.resolvedValue || variable.displayValue,
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-sm shadow-sm bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {IconComponent && (
                  <IconComponent size={24} className="opacity-50" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              {/* <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{name}</p>
                  <span className="text-xs opacity-50 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded">
                    {type}
                  </span>
                </div>
              </div> */}
              <button
                onClick={() => handleCopy(variable.value)}
                className="p-1.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title={copied ? "Copied!" : "Copy value"}
              >
                <Copy size={14} weight={copied ? "fill" : "regular"} />
              </button>
            </div>

            <p className="text-xs opacity-70 mt-1.5 font-mono">
              {variable.resolvedValue}
              {variable.type === "COLOR" && variable.resolvedName && (
                <span className="pl-1 opacity-60">{`(${variable.resolvedName})`}</span>
              )}
              {variable.type !== "COLOR" && variable.displayValue && (
                <span className="pl-1 opacity-60">{`(${variable.displayValue})`}</span>
              )}
            </p>

            {description && (
              <p className="text-xs mt-1.5 opacity-80 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
