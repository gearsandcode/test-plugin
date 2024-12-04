import { Button } from "../Button";
import { BranchSelector } from "../BranchSelector";
import type { PRFormMode, BranchSelectionMode } from "../../types";
import type { PRFormData, ExistingPR } from "../../types";
import { ArrowSquareOut, GitPullRequest } from "@phosphor-icons/react";

interface CreateUpdateViewProps {
  mode: PRFormMode;
  formData: PRFormData;
  existingPR?: ExistingPR;
  errors: Partial<Record<keyof PRFormData, string>>;
  branches: string[];
  branchesLoading: boolean;
  updateBranchMode: BranchSelectionMode;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBranchChange: (type: "base" | "update", value: string) => Promise<void>;
  onFormChange: (field: keyof PRFormData, value: string) => void;
  onUpdateBranchModeChange: (mode: BranchSelectionMode) => void;
  loading?: boolean;
}

export function CreateUpdateView({
  mode,
  formData,
  existingPR,
  errors,
  branches,
  branchesLoading,
  onSubmit,
  onBranchChange,
  onFormChange,
  onUpdateBranchModeChange,
  loading = false,
}: CreateUpdateViewProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        {existingPR && (
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <GitPullRequest
                  size={16}
                  weight="fill"
                  className="text-green-500"
                />
                Existing Pull Request Found
              </h3>
              <p className="text-xs opacity-70">
                PR #{existingPR.number}: {existingPR.title}
              </p>
            </div>
            <a
              href={existingPR.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              View PR
              <ArrowSquareOut size={12} />
            </a>
          </div>
        )}

        {!existingPR && (
          <div>
            <label className="text-xs font-medium mb-1.5 block">PR title</label>
            <input
              value={formData.title}
              onChange={(e) => onFormChange("title", e.target.value)}
              className={`
                  w-full px-2 py-1.5 text-xs rounded-sm
                  ${errors.title ? "border-red-500" : ""}
                `}
              placeholder="New pull request"
              required
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-medium mb-1.5 block">
            Commit message
          </label>
          <textarea
            value={formData.commitMessage}
            onChange={(e) => onFormChange("commitMessage", e.target.value)}
            className={`
                w-full px-2 py-1.5 text-xs rounded-sm h-16 resize-none
                ${errors.commitMessage ? "border-red-500" : ""}
              `}
            placeholder="feat: update design tokens"
            required
          />
          {errors.commitMessage && (
            <p className="text-xs text-red-500 mt-1">{errors.commitMessage}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <BranchSelector
            label="Base branch"
            branches={branches}
            selectedBranch={formData.baseBranch}
            onBranchChange={(value) => onBranchChange("base", value)}
            loading={branchesLoading}
            error={errors.baseBranch}
          />

          <BranchSelector
            label="Update branch"
            branches={branches.filter(
              (branch) => branch !== formData.baseBranch
            )}
            selectedBranch={formData.updateBranch}
            onBranchChange={(value) => onBranchChange("update", value)}
            onModeChange={onUpdateBranchModeChange}
            allowNew={true}
            loading={branchesLoading}
            error={errors.updateBranch}
          />
        </div>

        {!existingPR && (
          <div>
            <label className="text-xs font-medium mb-1.5 block">
              PR Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              className={`
                  w-full px-2 py-1.5 text-xs rounded-sm h-24 resize-none
                  ${errors.description ? "border-red-500" : ""}
                `}
              placeholder="Describe the changes in this commit..."
              required={mode === "create"}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end space-x-4">
          <Button type="submit" loading={loading}>
            {existingPR
              ? `Update Pull Request ${
                  existingPR ? ` #${existingPR.number}` : ""
                }`
              : "Create Pull Request"}
          </Button>
        </div>
      </div>
    </form>
  );
}
