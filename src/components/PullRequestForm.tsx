import React, { useState } from "react";
import { ArrowLeft, GitBranch, Plus } from "@phosphor-icons/react";
import { Button } from "./Button";
import { BranchSelect } from "./BranchSelect";
import { useGitHubBranches } from "../hooks/useGitHubBranches";
import type { StoredSettings } from "../types";

interface PRFormData {
  title: string;
  branch: string;
  description: string;
  baseBranch: string;
}

interface PullRequestFormProps {
  settings: StoredSettings;
  onCancel: () => void;
  onSubmit: (data: PRFormData) => Promise<void>;
  loading?: boolean;
}

export function PullRequestForm({
  settings,
  onCancel,
  onSubmit,
  loading,
}: PullRequestFormProps) {
  const [formData, setFormData] = useState<PRFormData>(() => ({
    title: "",
    branch: settings.commitData?.branch || "",
    description: "",
    baseBranch: "main",
  }));

  const [isCreatingNewBranch, setIsCreatingNewBranch] = useState(
    !settings.commitData?.branch
  );

  const {
    branches,
    loading: branchesLoading,
    error: branchesError,
  } = useGitHubBranches(settings);

  const [errors, setErrors] = useState<
    Partial<Record<keyof PRFormData, string>>
  >({});

  const handleChange = (field: keyof PRFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleBranchCreation = () => {
    setIsCreatingNewBranch(!isCreatingNewBranch);
    // Clear any branch-related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.branch;
      return newErrors;
    });

    // Reset branch value when switching to existing branch selection
    if (isCreatingNewBranch) {
      setFormData((prev) => ({
        ...prev,
        branch: branches[0] || "",
      }));
    }
  };

  const validateBranch = (
    branch: string,
    baseBranch: string
  ): string | null => {
    if (!branch.trim()) return "Branch name is required";
    if (isCreatingNewBranch) {
      if (branch === baseBranch)
        return "Update branch cannot be the same as base branch";
      if (branches.includes(branch)) return "Branch already exists";
    } else {
      if (branch === baseBranch)
        return "Update branch cannot be the same as base branch";
      if (!branches.includes(branch)) return "Selected branch does not exist";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Partial<Record<keyof PRFormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.baseBranch.trim())
      newErrors.baseBranch = "Base branch is required";

    const branchError = validateBranch(formData.branch, formData.baseBranch);
    if (branchError) newErrors.branch = branchError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("Failed to create PR:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="p-1 -ml-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-base font-medium">Create Pull Request</h2>
      </div>

      <div className="space-y-4">
        {branchesError && (
          <p className="text-xs text-red-500" role="alert">
            {branchesError}
          </p>
        )}

        <div>
          <label
            htmlFor="pr-title"
            className="block text-xs font-medium mb-1.5"
          >
            PR Title
          </label>
          <input
            id="pr-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={`
              w-full px-2 py-1.5 text-xs rounded-sm
              ${errors.title ? "border-red-500" : ""}
            `}
            placeholder="Update design tokens"
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <BranchSelect
            id="base-branch"
            branches={branches}
            selectedBranch={formData.baseBranch}
            onChange={(value) => handleChange("baseBranch", value)}
            loading={branchesLoading}
            label="BASE BRANCH"
            error={errors.baseBranch}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={
                  isCreatingNewBranch
                    ? "update-branch-input"
                    : "update-branch-select"
                }
                className="block text-xs font-medium"
              >
                <span className="inline-flex items-center">
                  <GitBranch size={12} className="mr-1" aria-hidden="true" />
                  UPDATE BRANCH
                </span>
              </label>
              <button
                type="button"
                onClick={toggleBranchCreation}
                className="text-xs inline-flex items-center opacity-60 hover:opacity-100"
                aria-label={
                  isCreatingNewBranch
                    ? "Switch to selecting existing branch"
                    : "Switch to creating new branch"
                }
              >
                <Plus size={12} className="mr-1" aria-hidden="true" />
                {isCreatingNewBranch ? "Select Existing" : "Create New"}
              </button>
            </div>

            {isCreatingNewBranch ? (
              <input
                id="update-branch-input"
                type="text"
                value={formData.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                className={`
                  w-full px-2 py-1.5 text-xs rounded-sm
                  ${errors.branch ? "border-red-500" : ""}
                `}
                placeholder="design/update-tokens"
              />
            ) : (
              <BranchSelect
                id="update-branch-select"
                branches={branches.filter((b) => b !== formData.baseBranch)}
                selectedBranch={formData.branch}
                onChange={(value) => handleChange("branch", value)}
                loading={branchesLoading}
                error={errors.branch}
              />
            )}
            {errors.branch && (
              <p className="text-xs text-red-500 mt-1" role="alert">
                {errors.branch}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="pr-description"
            className="block text-xs font-medium mb-1.5"
          >
            Description
          </label>
          <textarea
            id="pr-description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className={`
              w-full px-2 py-1.5 text-xs rounded-sm h-24 resize-none
              ${errors.description ? "border-red-500" : ""}
            `}
            placeholder="Describe the changes in these design tokens..."
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {errors.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading || branchesLoading}>
          Create Pull Request
        </Button>
      </div>
    </form>
  );
}
