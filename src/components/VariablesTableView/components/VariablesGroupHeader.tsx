interface VariablesGroupHeaderProps {
  groupPath: string;
  modesCount: number;
}

export function VariablesGroupHeader({
  groupPath,
  modesCount,
}: VariablesGroupHeaderProps) {
  return (
    <tr>
      <td className="sticky top-[54px] left-0 z-50 p-3 pt-6 text-xs border-b border-figma-border w-[200px] min-w-[160px] bg-figma-bg">
        {groupPath.split("/").map((part, index, array) => (
          <span key={index}>
            {array.length > 1 && index === array.length - 1 ? (
              <strong>{part}</strong>
            ) : (
              <>
                {part}
                {array.length > 1 && <span className="mx-1">/</span>}
              </>
            )}
          </span>
        ))}
      </td>
      <td
        colSpan={modesCount}
        className="sticky top-[54px] left-0 z-40 p-3 pt-6 text-xs border-b border-figma-border bg-figma-bg"
      />
    </tr>
  );
}
