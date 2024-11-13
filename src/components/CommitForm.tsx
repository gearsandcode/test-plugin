import React from "react";
import { useFormField } from "../hooks/useFormField";
import { useGitHubBranches } from "../hooks/useGitHubBranches";
import { useCommit } from "../hooks/useCommit";
import { Spinner } from "@phosphor-icons/react";
import type { StoredSettings, CommitData } from "../PluginStore";

interface Props {
  settings: StoredSettings;
}

const CommitForm: React.FC<Props> = ({ settings }) => {
  const branch = useFormField(settings.commitData?.branch || "");
  const message = useFormField(settings.commitData?.message || "");
  const filename = useFormField(settings.commitData?.filename || "test.md");
  const fileContent = useFormField(settings.commitData?.file || "");

  const {
    branches,
    loading: branchesLoading,
    error: branchesError,
  } = useGitHubBranches(settings);
  const {
    createCommit,
    loading: commitLoading,
    error: commitError,
  } = useCommit(settings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.value.trim()) {
      message.setError("Commit message is required");
      return;
    }

    const commitData: CommitData = {
      branch: branch.value,
      message: message.value,
      filename: filename.value,
      file: fileContent.value,
    };

    await createCommit(commitData);
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-base font-medium">Create GitHub Commit</h1>
        <p className="text-xs opacity-50 mt-1">
          Commit files directly to your GitHub repository
        </p>
      </div>

      {(commitError || branchesError) && (
        <div className="p-3 mt-6 bg-red-50 rounded-sm">
          <p className="text-xs text-red-600">{commitError || branchesError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs flex items-center justify-between">
              BRANCH
              {branchesLoading && (
                <span className="opacity-50">Loading...</span>
              )}
            </label>
            <div className="relative">
              <select
                className="w-full px-2 py-1.5 border rounded-sm text-sm appearance-none"
                value={branch.value}
                onChange={(e) => branch.onChange(e.target.value)}
                disabled={branchesLoading}
              >
                {branches.map((branchName) => (
                  <option key={branchName} value={branchName}>
                    {branchName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="h-4 w-4 opacity-50"
                  fill="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs">FILENAME</label>
            <input
              className="w-full px-2 py-1.5 border rounded-sm text-sm"
              value={filename.value}
              onChange={(e) => filename.onChange(e.target.value)}
              placeholder="e.g., test.md"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs">COMMIT MESSAGE</label>
          <input
            className={`w-full px-2 py-1.5 border rounded-sm text-sm ${
              message.error ? "border-red-500" : ""
            }`}
            value={message.value}
            onChange={(e) => message.onChange(e.target.value)}
            placeholder="e.g., docs: update test.md"
            required
          />
          {message.error && (
            <span className="text-xs text-red-500">{message.error}</span>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs">FILE CONTENT</label>
          <textarea
            className="w-full px-2 py-1.5 border rounded-sm text-sm font-mono resize-y"
            value={fileContent.value}
            onChange={(e) => fileContent.onChange(e.target.value)}
            rows={8}
            required
          />
        </div>

        <button
          type="submit"
          disabled={commitLoading}
          className={`
            w-full py-1.5 px-3 
            rounded-sm text-sm text-white
            transition-colors
            flex items-center justify-center space-x-2
            ${
              commitLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            }
          `}
        >
          {commitLoading ? (
            <>
              <Spinner className="w-4 h-4 animate-spin" />
              <span>Creating Commit...</span>
            </>
          ) : (
            "Create Commit"
          )}
        </button>
      </form>
    </div>
  );
};

export default CommitForm;
