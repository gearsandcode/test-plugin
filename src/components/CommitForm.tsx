import React, { useState, useEffect, FormEvent, useRef } from "react";
import type { StoredSettings, CommitData } from "../PluginStore.js";

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
  console.log("CommitForm mounting with settings:", {
    commitData: settings.commitData,
    hasToken: !!settings.token,
    org: settings.organization,
    repo: settings.repository,
  });

  // Initialize form data directly from settings
  const [formData, setFormData] = useState<CommitData>(() => {
    console.log("Initializing formData with commitData:", settings.commitData);
    return {
      branch: settings.commitData?.branch || "",
      message: settings.commitData?.message || "",
      filename: settings.commitData?.filename || "test.md",
      file: settings.commitData?.file || `test ${new Date().toISOString()}`,
    };
  });

  const currentSettingsHash = useRef(settingsHash(settings));
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [branchesLoading, setBranchesLoading] = useState<boolean>(false);

  const saveFormData = (newData: CommitData) => {
    console.log("Saving form data:", newData);
    setFormData(newData);

    const updatedSettings = {
      ...settings,
      commitData: newData,
    };

    console.log("Sending updated settings to plugin:", updatedSettings);
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: updatedSettings,
        },
      },
      "*"
    );
  };

  const fetchBranches = async () => {
    if (!settings.organization || !settings.repository || !settings.token) {
      console.log("Missing required settings:", {
        hasOrg: !!settings.organization,
        hasRepo: !!settings.repository,
        hasToken: !!settings.token,
      });
      setError(
        "Missing required settings (organization, repository, or token)"
      );
      return;
    }

    setBranchesLoading(true);
    const url = `https://api.github.com/repos/${settings.organization}/${settings.repository}/branches`;
    console.log("Fetching branches from:", url);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${settings.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      console.log("API Response status:", response.status);
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        let errorMessage =
          data.message || `API returned status ${response.status}`;

        if (response.status === 404) {
          errorMessage =
            "Repository not found. Please check organization and repository names.";
        } else if (response.status === 401) {
          errorMessage =
            "Invalid or expired token. Please check your GitHub token.";
        } else if (response.status === 403) {
          errorMessage = "Access denied. Please check your token permissions.";
        }

        throw new Error(errorMessage);
      }

      const branchNames = data.map((branch: { name: string }) => branch.name);
      console.log("Fetched branches:", branchNames);
      console.log("Current form data branch:", formData.branch);

      setBranches(branchNames);

      // If we have a saved branch, verify it exists in the fetched branches
      if (formData.branch) {
        if (!branchNames.includes(formData.branch)) {
          console.warn("Saved branch no longer exists:", formData.branch);
          // Optionally reset to first available branch
          if (branchNames.length > 0) {
            saveFormData({
              ...formData,
              branch: branchNames[0],
            });
          }
        }
      } else if (branchNames.length > 0) {
        // No branch selected, pick the first one
        console.log(
          "No branch selected, selecting first branch:",
          branchNames[0]
        );
        saveFormData({
          ...formData,
          branch: branchNames[0],
        });
      }
    } catch (err) {
      console.error("Error in fetchBranches:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch branches");
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Sync form data when settings change
  useEffect(() => {
    console.log("Settings changed effect running:", {
      currentHash: currentSettingsHash.current,
      newHash: settingsHash(settings),
      commitData: settings.commitData,
    });

    const newHash = settingsHash(settings);
    if (
      newHash !== currentSettingsHash.current ||
      settings.commitData?.branch !== formData.branch
    ) {
      currentSettingsHash.current = newHash;

      // Update form data if commitData exists
      if (settings.commitData) {
        console.log("Updating form data from settings:", settings.commitData);
        setFormData(settings.commitData);
      }

      fetchBranches();
    }
  }, [settings]);

  // Initial fetch on mount
  useEffect(() => {
    console.log("Initial mount effect running");
    fetchBranches();
  }, []);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranch = e.target.value;
    console.log("Branch change:", { from: formData.branch, to: newBranch });
    saveFormData({
      ...formData,
      branch: newBranch,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    saveFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <div>Current branch: {formData.branch || "none"}</div>
        <div>Available branches: {branches.join(", ")}</div>
        <div>Loading: {branchesLoading ? "yes" : "no"}</div>
      </div>
      <div>
        <h1 className="text-base font-medium">Create GitHub Commit</h1>
        <p className="text-xs text-black/50">
          Commit files directly to your GitHub repository
        </p>
      </div>

      {error && (
        <div className="p-3 mt-4 mb-4 bg-red-50 border border-red-200 rounded-sm">
          <div className="flex">
            <div className="flex-1">
              <p className="text-xs font-medium text-red-800">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Please check:
                <ul className="list-disc ml-4 mt-1">
                  <li>Your Personal Access Token is valid</li>
                  <li>The organization/user name is correct</li>
                  <li>The repository name is correct</li>
                  <li>You have access to the repository</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs flex items-center justify-between">
              BRANCH
              {branchesLoading && (
                <span className="text-black/30">Loading...</span>
              )}
            </label>
            <select
              value={formData.branch}
              onChange={handleBranchChange}
              className="w-full px-2 py-1.5 border rounded-sm text-sm bg-white border-black/10 hover:border-black/30 focus:outline-none focus:border-blue-500"
              disabled={branchesLoading}
            >
              {branches.length === 0 ? (
                <option value="">
                  {branchesLoading
                    ? "Loading branches..."
                    : "No branches found"}
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
          <Field label="FILENAME" name="filename" placeholder="e.g., test.md" />
        </div>

        <Field
          label="COMMIT MESSAGE"
          name="message"
          required={false}
          placeholder="Leave blank to use default message"
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
