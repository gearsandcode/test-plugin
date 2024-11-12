import React, { useState, useEffect, FormEvent, useRef } from "react";
import type {
  StoredSettings,
  CommitData,
  PartialCommitData,
} from "../PluginStore.js";

interface Props {
  settings: StoredSettings;
}

interface PluginMessage {
  type: string;
  success: boolean;
}

const settingsHash = (
  settings: Pick<StoredSettings, "organization" | "repository" | "token">
) => {
  return `${settings.organization}:${settings.repository}:${settings.token}`;
};

const CommitForm: React.FC<Props> = ({ settings }) => {
  const currentSettingsHash = useRef(settingsHash(settings));
  const [formData, setFormData] = useState<CommitData>(() => ({
    branch: settings.commitData?.branch || "",
    message: settings.commitData?.message || "",
    filename: settings.commitData?.filename || "test.md",
    file: settings.commitData?.file || `test ${new Date().toISOString()}`,
  }));
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [branchesLoading, setBranchesLoading] = useState<boolean>(false);

  // Update form data when settings change
  useEffect(() => {
    if (settings.commitData) {
      setFormData((prevData) => ({
        ...prevData,
        ...settings.commitData,
      }));
    }
  }, [settings]);

  const fetchBranches = async () => {
    if (!settings.organization || !settings.repository) {
      console.log("Missing org or repo");
      return;
    }

    setBranchesLoading(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/branches`,
        {
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch branches");
      }

      const data = await response.json();
      const branchNames = data.map((branch: { name: string }) => branch.name);
      setBranches(branchNames);

      // Only set a default branch if we don't have one already
      if (!formData.branch && branchNames.length > 0) {
        const savedBranch = settings.commitData?.branch;
        const newBranch =
          savedBranch && branchNames.includes(savedBranch)
            ? savedBranch
            : branchNames[0];

        handleBranchChange({
          target: { value: newBranch },
        } as React.ChangeEvent<HTMLSelectElement>);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch branches");
    } finally {
      setBranchesLoading(false);
    }
  };

  // Update form data when settings change
  useEffect(() => {
    if (settings.commitData) {
      setFormData((prevData) => ({
        ...prevData,
        ...settings.commitData,
      }));
    }
  }, [settings]);

  const saveFormData = (newFormData: CommitData) => {
    setFormData(newFormData);

    const partialCommitData: PartialCommitData = {
      branch: newFormData.branch,
      message: newFormData.message,
      filename: newFormData.filename,
      file: newFormData.file,
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: {
            ...settings,
            commitData: partialCommitData,
          },
        },
      },
      "*"
    );
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranch = e.target.value;

    const newFormData = {
      ...formData,
      branch: newBranch,
    };
    saveFormData(newFormData);
  };

  // Initial load
  useEffect(() => {
    fetchBranches();
  }, []);

  // Refetch when repo settings change
  useEffect(() => {
    const newHash = settingsHash(settings);
    if (newHash !== currentSettingsHash.current) {
      currentSettingsHash.current = newHash;
      fetchBranches();
    }
  }, [settings.organization, settings.repository, settings.token]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    saveFormData(newFormData);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      setError("Commit message is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First, get the reference to the branch
      const branchRef = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/refs/heads/${formData.branch}`,
        {
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const branchData = await branchRef.json();
      if (!branchRef.ok)
        throw new Error(branchData.message || "Failed to get branch reference");

      // Create a blob with the file content
      const blobResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/blobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: formData.file,
            encoding: "utf-8",
          }),
        }
      );

      const blobData = await blobResponse.json();
      if (!blobResponse.ok)
        throw new Error(blobData.message || "Failed to create blob");

      // Get the current tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/trees/${branchData.object.sha}`,
        {
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const treeData = await treeResponse.json();
      if (!treeResponse.ok)
        throw new Error(treeData.message || "Failed to get tree");

      // Create a new tree
      const newTreeResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/trees`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base_tree: treeData.sha,
            tree: [
              {
                path: formData.filename,
                mode: "100644",
                type: "blob",
                sha: blobData.sha,
              },
            ],
          }),
        }
      );

      const newTreeData = await newTreeResponse.json();
      if (!newTreeResponse.ok)
        throw new Error(newTreeData.message || "Failed to create tree");

      // Create a commit
      const commitResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/commits`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: formData.message || `Update ${formData.filename}`,
            tree: newTreeData.sha,
            parents: [branchData.object.sha],
          }),
        }
      );

      const commitData = await commitResponse.json();
      if (!commitResponse.ok)
        throw new Error(commitData.message || "Failed to create commit");

      // Update the reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/refs/heads/${formData.branch}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sha: commitData.sha,
            force: true,
          }),
        }
      );

      if (!updateRefResponse.ok) {
        const updateRefData = await updateRefResponse.json();
        throw new Error(updateRefData.message || "Failed to update reference");
      }

      const message: PluginMessage = { type: "create-commit", success: true };
      parent.postMessage({ pluginMessage: message }, "*");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    name,
    type = "text",
    placeholder = "",
    required = true,
    rows = undefined,
    as = "input",
  }: {
    label: string;
    name: keyof typeof formData;
    type?: string;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    as?: "input" | "textarea" | "select";
  }) => {
    const baseClasses = `
      w-full px-2 py-1.5 
      border rounded-sm 
      focus:outline-none focus:border-blue-500
      transition-colors
      text-sm
      bg-white border-black/10 hover:border-black/30
    `;

    if (as === "select") {
      return (
        <div className="space-y-1">
          <label className="text-xs flex items-center justify-between">
            {label}
            {branchesLoading && (
              <span className="text-black/30">Loading...</span>
            )}
          </label>
          <select
            name={name}
            className={baseClasses}
            value={formData[name]}
            onChange={handleInputChange}
            required={required}
            disabled={branchesLoading}
          >
            {branches.length === 0 ? (
              <option value="">
                {branchesLoading ? "Loading branches..." : "No branches found"}
              </option>
            ) : (
              branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))
            )}
          </select>
        </div>
      );
    }

    if (as === "textarea") {
      return (
        <div className="space-y-1">
          <label className="text-xs">
            {label}
            {!required && <span className="text-black/30 ml-2">Optional</span>}
          </label>
          <textarea
            name={name}
            className={`${baseClasses} font-mono resize-y`}
            value={formData[name]}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
          />
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <label className="text-xs">
          {label}
          {!required && <span className="text-black/30 ml-2">Optional</span>}
        </label>
        <input
          type={type}
          name={name}
          className={baseClasses}
          value={formData[name]}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 pb-6">
      <div>
        <h1 className="text-base font-medium">Create GitHub Commit</h1>
        <p className="text-xs text-black/50">
          Commit files directly to your GitHub repository
        </p>
      </div>

      {error && (
        <div className="p-3 mt-6 bg-red-50 border border-red-100 rounded-sm">
          <div className="flex">
            <div className="ml-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="BRANCH" name="branch" as="select" />
          <Field label="FILENAME" name="filename" placeholder="e.g., test.md" />
        </div>

        <Field
          label="COMMIT MESSAGE"
          name="message"
          required={true}
          placeholder="e.g., docs: update test.md"
        />

        <Field label="FILE CONTENT" name="file" as="textarea" rows={8} />

        <button
          type="submit"
          className={`
            w-full py-1.5 px-3 
            rounded-sm text-white
            transition-colors duration-200 text-xs
            ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            }
            flex items-center justify-center space-x-2
          `}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin">↻</span>
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
