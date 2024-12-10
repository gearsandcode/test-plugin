import { ModeValue } from "../../../types";

interface ModeValueDisplayProps {
  modeValue: ModeValue;
}

export function ModeValueDisplay({ modeValue }: ModeValueDisplayProps) {
  if (modeValue.type === "COLOR") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-sm border border-figma-border"
          style={{
            backgroundColor: modeValue.resolvedValue || modeValue.value,
          }}
        />
        <p>{modeValue.resolvedName || modeValue.resolvedValue}</p>
      </div>
    );
  }

  return <p>{modeValue.value}</p>;
}
