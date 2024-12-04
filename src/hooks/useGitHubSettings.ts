import { StoredSettings } from "types";

export function useGitHubSettings() {
  function updateCommitData(data: { branch?: string; baseBranch?: string }) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: {
            // Update both legacy and new locations
            branch: data.branch,
            baseBranch: data.baseBranch,
            commitData: data,
          },
        },
      },
      "*"
    );
  }

  function loadSettings() {
    parent.postMessage({ pluginMessage: { type: "load-settings" } }, "*");
  }

  function saveSettings(newSettings: Partial<StoredSettings>) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: newSettings,
        },
      },
      "*"
    );
  }

  return {
    loadSettings,
    saveSettings,
    updateCommitData,
  };
}
