/**
 * @fileoverview PR form with existing PR detection and simplified commit flow
 */
import React, { useState, useEffect } from "react";
import { useGitHubBranches } from "../../hooks/useGitHubBranches";
import { useGitHubSettings } from "../../hooks/useGitHubSettings";
import { ArrowSquareOut, GitPullRequest } from "@phosphor-icons/react";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { BranchSelector } from "../BranchSelector";
import { notify } from "../../utils";
import type { ExistingPR, StoredSettings } from "../../types";
import { GitHubService } from "../../services/github";
import { SuccessDialog } from "../SuccessDialog";

interface CommitFormData {
  commitMessage: string;
  updateBranch: string;
  baseBranch: string;
}

interface PullRequestFormProps {
  settings: StoredSettings;
  onCancel: () => void;
  content: string;
  loading?: boolean;
}

export function PullRequestForm({
  settings,
  onCancel,
  content,
  loading: initialLoading = false,
}: PullRequestFormProps) {
  const [formData, setFormData] = useState<CommitFormData>(() => ({
    commitMessage: "",
    updateBranch: settings.commitData?.branch || "",
    baseBranch: settings.commitData?.baseBranch || "main",
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof CommitFormData, string>>
  >({});
  const [loading, setLoading] = useState(initialLoading);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [existingPR, setExistingPR] = useState<ExistingPR | undefined>(
    undefined
  );
  const [checkingPR, setCheckingPR] = useState(false);

  const github = new GitHubService(
    {
      token: settings.token,
      organization: settings.organization,
      repository: settings.repository,
    },
    process.env.NODE_ENV === "development"
  );

  const { branches, loading: branchesLoading } = useGitHubBranches(settings);
  const { updateCommitData } = useGitHubSettings();

  // Check for existing PR when branches change

  useEffect(() => {
    async function checkExistingPR() {
      if (!formData.updateBranch || !formData.baseBranch) return;

      setCheckingPR(true);
      try {
        const pr = await github.findPullRequest(
          formData.updateBranch,
          formData.baseBranch
        );
        if (pr) {
          setExistingPR({
            number: pr.number,
            title: pr.title,
            html_url: pr.html_url,
            head: formData.updateBranch,
          });
        } else {
          setExistingPR(undefined);
        }
      } catch (error) {
        console.error("Error checking for existing PR:", error);
      } finally {
        setCheckingPR(false);
      }
    }

    checkExistingPR();
  }, [formData.updateBranch, formData.baseBranch]);

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await github.commitChanges({
        branch: formData.updateBranch,
        message: formData.commitMessage,
        content: content,
      });

      await updateCommitData({
        branch: formData.updateBranch,
        baseBranch: formData.baseBranch,
      });

      notify("Successfully committed changes!");
      setShowSuccessDialog(true);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Failed to commit changes",
        true
      );
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof CommitFormData, string>> = {};

    if (!formData.commitMessage.trim()) {
      newErrors.commitMessage = "Commit message is required";
    }
    if (!formData.updateBranch.trim()) {
      newErrors.updateBranch = "Branch is required";
    }
    if (formData.updateBranch === formData.baseBranch) {
      newErrors.updateBranch = "Branch cannot be same as base branch";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleBranchChange(type: "base" | "update", value: string) {
    setFormData((prev) => ({
      ...prev,
      [type === "base" ? "baseBranch" : "updateBranch"]: value,
    }));
    setErrors({});
  }

  const createPRUrl = existingPR
    ? existingPR.html_url
    : `https://github.com/${settings.organization}/${settings.repository}/compare/${formData.baseBranch}...${formData.updateBranch}?expand=1`;

  return (
    <>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Commit Changes</h2>
        </div>
        {checkingPR && (
          <Alert
            type="loading"
            message={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-stone-300 border-t-stone-600" />
                  <span className="text-xs opacity-50">
                    Checking for existing PR...
                  </span>
                </div>
              </div>
            }
          />
        )}

        {existingPR && (
          <Alert
            type="info"
            message={
              <div className="flex items-start justify-between w-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitPullRequest size={16} />
                    <span>Existing pull request found</span>
                  </div>
                  <a
                    href={existingPR.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 hover:opacity-80"
                  >
                    PR #{existingPR.number}: {existingPR.title}{" "}
                    <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>
            }
          />
        )}

        <form onSubmit={handleCommit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">
              Commit message
            </label>
            <textarea
              value={formData.commitMessage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  commitMessage: e.target.value,
                }))
              }
              className={`
              w-full px-2 py-1.5 text-xs rounded-sm h-16 resize-none
              ${errors.commitMessage ? "border-red-500" : ""}
            `}
              placeholder="feat: update design tokens"
              required
            />
            {errors.commitMessage && (
              <p className="text-xs text-red-500 mt-1">
                {errors.commitMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <BranchSelector
              label="Base branch"
              branches={branches}
              selectedBranch={formData.baseBranch}
              onBranchChange={(value) => handleBranchChange("base", value)}
              loading={branchesLoading}
              error={errors.baseBranch}
            />

            <BranchSelector
              label="Update branch"
              branches={branches.filter(
                (branch) => branch !== formData.baseBranch
              )}
              selectedBranch={formData.updateBranch}
              onBranchChange={(value) => handleBranchChange("update", value)}
              loading={branchesLoading}
              error={errors.updateBranch}
              allowNew={true}
            />
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button type="submit" loading={loading}>
              Commit Changes
            </Button>
          </div>
        </form>
      </div>
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        prUrl={createPRUrl}
        branch={formData.updateBranch}
        existingPR={existingPR}
      />
    </>
  );
}
