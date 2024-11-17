import { useState, useEffect } from "react";
import { Input, Button, Alert, BranchSelect } from "../components";
import { useGitHubBranches, useCommit } from "../hooks";
import type { StoredSettings, CommitData } from "../types";

type CommitFormProps = {
  settings: StoredSettings;
  onUpdateCommitData?: (data: Partial<CommitData>) => void;
};

export function CommitForm({ settings, onUpdateCommitData }: CommitFormProps) {
  const [formData, setFormData] = useState<CommitData>({
    branch: settings.commitData?.branch || "",
    message: settings.commitData?.message || "",
    filename: settings.commitData?.filename || "test.md",
    content: settings.commitData?.content || "",
  });

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CommitData, string>>
  >({});
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

  // Update form data when settings change
  useEffect(() => {
    if (settings.commitData) {
      setFormData((prev) => ({
        ...prev,
        ...settings.commitData,
      }));
    }
  }, [settings.commitData]);

  function handleInputChange(key: keyof CommitData, value: string) {
    const newFormData = {
      ...formData,
      [key]: value,
    };

    setFormData(newFormData);

    if (formErrors[key]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    // Persist the change
    onUpdateCommitData?.({ [key]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form
    const errors: Partial<Record<keyof CommitData, string>> = {};
    if (!formData.branch) errors.branch = "Branch is required";
    if (!formData.message.trim()) errors.message = "Commit message is required";
    if (!formData.filename.trim()) errors.filename = "Filename is required";
    if (!formData.content.trim()) errors.content = "Content is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createCommit(formData);
      // Optionally clear form or show success message
      // But don't save settings here - they're already saved via onUpdateCommitData
    } catch (err) {
      console.error("Commit failed:", err);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-medium">Create Commit</h2>
        </div>
        <p className="text-sm opacity-50">
          Create a new commit in your GitHub repository
        </p>
      </div>

      {(commitError || branchesError) && (
        <Alert
          type="error"
          message={commitError || branchesError}
          onDismiss={() => {}}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <BranchSelect
          branches={branches}
          selectedBranch={formData.branch}
          onChange={(value) => handleInputChange("branch", value)}
          loading={branchesLoading}
          error={formErrors.branch}
        />

        <Input
          label="FILENAME"
          value={formData.filename}
          onChange={(e) => handleInputChange("filename", e.target.value)}
          placeholder="e.g., docs/README.md"
          error={formErrors.filename}
          required
        />
      </div>

      <Input
        label="COMMIT MESSAGE"
        value={formData.message}
        onChange={(e) => handleInputChange("message", e.target.value)}
        placeholder="e.g., Update documentation"
        error={formErrors.message}
        required
      />

      <div className="space-y-1">
        <label className="text-xs opacity-60">FILE CONTENT</label>
        <textarea
          value={formData.content}
          onChange={(e) => handleInputChange("content", e.target.value)}
          className={`
            w-full px-2 py-1.5 text-xs
            rounded-sm
            font-mono min-h-[200px] resize-y
            ${formErrors.content ? "border-red-500" : ""}
          `}
          placeholder="Enter file content..."
          required
        />
        {formErrors.content && (
          <p className="text-xs text-red-500">{formErrors.content}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={commitLoading}
          disabled={branchesLoading || commitLoading}
        >
          Create Commit
        </Button>
      </div>
    </form>
  );
}
