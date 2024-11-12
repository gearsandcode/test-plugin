export interface CommitData {
  branch: string;
  message: string;
  filename: string;
  file: string;
}

export type PartialCommitData = Partial<CommitData>;

export interface StoredSettings {
  token: string;
  organization: string;
  repository: string;
  label: string;
  commitData?: PartialCommitData;
}

const DEFAULT_SETTINGS: StoredSettings = {
  token: "",
  organization: "gearsandcode",
  repository: "docs",
  label: "figma-plugin",
  commitData: {
    branch: "",
    message: "",
    filename: "test.md",
    file: "",
  },
};

export async function saveSettings(settings: Partial<StoredSettings>) {
  try {
    const currentSettings = await loadSettings();

    // Deep merge the settings
    const newSettings: StoredSettings = {
      ...currentSettings,
      ...settings,
      commitData: settings.commitData
        ? {
            ...(currentSettings.commitData || {}),
            ...settings.commitData,
          }
        : currentSettings.commitData,
    };

    await figma.clientStorage.setAsync("github-settings", newSettings);
    return newSettings;
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

    // Ensure commitData exists and merge with defaults
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      commitData: {
        ...DEFAULT_SETTINGS.commitData,
        ...(settings.commitData || {}),
      },
    };
  } catch (error) {
    console.error("Error in loadSettings:", error);
    throw error;
  }
}
