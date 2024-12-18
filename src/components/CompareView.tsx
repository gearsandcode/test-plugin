import { useState, useEffect } from "react";
import { useGitHubBranches } from "../hooks/useGitHubBranches";
import { BranchSelector } from "./BranchSelector";
import { JSONPreview } from "./JSONPreview";
import { GitHubService } from "../services/github";
import type { StoredSettings } from "../types";

interface CompareViewProps {
  settings: StoredSettings;
  content: string;
}

export function CompareView({ settings, content }: CompareViewProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [viewMode, setViewMode] = useState<"json" | "diff">("diff");

  const github = new GitHubService(
    {
      token: settings.token,
      organization: settings.organization,
      repository: settings.repository,
    },
    process.env.NODE_ENV === "development"
  );

  const { branches, loading: branchesLoading } = useGitHubBranches(settings);

  useEffect(() => {
    async function fetchDiff() {
      if (!selectedBranch) return;

      setLoadingDiff(true);
      try {
        // Compare current content against selected branch
        const diff = await github.getDiff(selectedBranch, content);
        setDiffContent(diff);
      } catch (error) {
        console.error("Error fetching diff:", error);
        setDiffContent(null);
      } finally {
        setLoadingDiff(false);
      }
    }

    fetchDiff();
  }, [selectedBranch, content]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("json")}
            className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${
              viewMode === "json"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => setViewMode("diff")}
            className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${
              viewMode === "diff"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            Changes
          </button>
        </div>

        <div className="w-64">
          <BranchSelector
            label="Compare with"
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            loading={branchesLoading}
          />
        </div>
      </div>

      {viewMode === "json" ? (
        <JSONPreview content={content} />
      ) : (
        <div className="border rounded-sm">
          {loadingDiff ? (
            <div className="p-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-300 border-t-stone-600" />
            </div>
          ) : diffContent ? (
            <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto max-h-[calc(100vh-300px)]">
              {diffContent}
            </pre>
          ) : (
            <div className="p-4 text-xs text-center opacity-60">
              No changes available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
