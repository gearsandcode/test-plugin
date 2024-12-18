import type { StoredSettings, PartialCommitData, ViewState } from "./types";

// Add view state defaults
const DEFAULT_VIEW_STATE: ViewState = {
  activeView: "list",
  selectedCollection: "",
  selectedGroup: null,
};

const DEFAULT_COMMIT_DATA: PartialCommitData = {
  branch: "",
  baseBranch: "main",
  message: "",
  filename: "variables.json",
  content: "",
};

const DEFAULT_SETTINGS: StoredSettings = {
  token: "",
  organization: "",
  repository: "",
  label: "",
  commitData: DEFAULT_COMMIT_DATA,
};

export async function saveSettings(
  newSettings: Partial<StoredSettings>
): Promise<StoredSettings> {
  try {
    const currentSettings = await loadSettings();

    // Merge the new settings with current settings
    const mergedSettings: StoredSettings = {
      token: newSettings.token || currentSettings.token,
      organization: newSettings.organization || currentSettings.organization,
      repository: newSettings.repository || currentSettings.repository,
      label: newSettings.label || currentSettings.label,
      commitData: {
        branch:
          newSettings.commitData?.branch ||
          currentSettings.commitData?.branch ||
          DEFAULT_COMMIT_DATA.branch,
        baseBranch:
          newSettings.commitData?.baseBranch ||
          currentSettings.commitData?.baseBranch ||
          DEFAULT_COMMIT_DATA.baseBranch,
        message:
          newSettings.commitData?.message ||
          currentSettings.commitData?.message ||
          DEFAULT_COMMIT_DATA.message,
        filename:
          newSettings.commitData?.filename ||
          currentSettings.commitData?.filename ||
          DEFAULT_COMMIT_DATA.filename,
        content:
          newSettings.commitData?.content ||
          currentSettings.commitData?.content ||
          DEFAULT_COMMIT_DATA.content,
      },
    };

    await figma.clientStorage.setAsync("github-settings", mergedSettings);
    return mergedSettings;
  } catch (error) {
    console.error("Error in saveSettings:", error);
    throw error;
  }
}

export async function loadSettings(): Promise<StoredSettings> {
  try {
    const settings = await figma.clientStorage.getAsync("github-settings");
    if (!settings) {
      return DEFAULT_SETTINGS;
    }

    // Ensure all fields exist with proper defaults
    return {
      token: settings.token || DEFAULT_SETTINGS.token,
      organization: settings.organization || DEFAULT_SETTINGS.organization,
      repository: settings.repository || DEFAULT_SETTINGS.repository,
      label: settings.label || DEFAULT_SETTINGS.label,
      commitData: {
        branch: settings.commitData?.branch || DEFAULT_COMMIT_DATA.branch,
        baseBranch:
          settings.commitData?.baseBranch || DEFAULT_COMMIT_DATA.baseBranch,
        message: settings.commitData?.message || DEFAULT_COMMIT_DATA.message,
        filename: settings.commitData?.filename || DEFAULT_COMMIT_DATA.filename,
        content: settings.commitData?.content || DEFAULT_COMMIT_DATA.content,
      },
    };
  } catch (error) {
    console.error("Error in loadSettings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveViewState(state: ViewState): Promise<ViewState> {
  try {
    await figma.clientStorage.setAsync("viewState", state);
    return state;
  } catch (error) {
    console.error("Error saving view state:", error);
    throw error;
  }
}

export async function loadViewState(): Promise<ViewState> {
  try {
    const state = await figma.clientStorage.getAsync("viewState");
    return state || DEFAULT_VIEW_STATE;
  } catch (error) {
    console.error("Error loading view state:", error);
    return DEFAULT_VIEW_STATE;
  }
}

export async function resetViewState(): Promise<void> {
  try {
    // Delete view state from storage
    await figma.clientStorage.deleteAsync("viewState");

    // Send reset message to UI
    figma.ui.postMessage({
      type: "view-state-reset",
    });
  } catch (error) {
    console.error("Error resetting view state:", error);
    throw error;
  }
}
