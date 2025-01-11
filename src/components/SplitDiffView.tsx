import { ArrowSquareOut } from "@phosphor-icons/react";

interface SplitDiffViewProps {
  localContent: string;
  remoteContent: string | null;
  loading?: boolean;
  compareUrl?: string;
  branchName?: string;
}

export function SplitDiffView({
  localContent,
  remoteContent,
  loading,
  compareUrl,
  branchName,
}: SplitDiffViewProps) {
  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-300 border-t-stone-600" />
      </div>
    );
  }

  const formatJson = (content: string) => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  };

  return (
    <div className="border rounded-sm">
      <div className="border-b px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex gap-4">
          <span>Local Changes</span>
          <span>{branchName ? `Remote (${branchName})` : "New Branch"}</span>
        </div>
        {compareUrl && (
          <a
            href={compareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:opacity-80"
          >
            View on GitHub <ArrowSquareOut size={12} />
          </a>
        )}
      </div>
      <div className="flex divide-x">
        <pre className="flex-1 p-3 text-xs font-mono whitespace-pre overflow-x-auto max-h-[500px]">
          {formatJson(localContent)}
        </pre>
        <div className="flex-1 p-3 text-xs font-mono whitespace-pre overflow-x-auto max-h-[500px] border-l">
          {remoteContent === "{}" ? (
            <div className="text-xs opacity-60 text-center">
              {branchName
                ? "No existing file in branch"
                : "New branch will be created"}
            </div>
          ) : (
            <pre
              dangerouslySetInnerHTML={{
                __html: formatJson(remoteContent || "{}"),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
