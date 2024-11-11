export interface CommitData {
  branch: string;
  message: string;
  filename: string;
  file: string;
}

export interface StoredSettings {
  token: string;
  organization: string;
  repository: string;
  label: string;
  commitData?: CommitData;
}

const DEFAULT_SETTINGS: StoredSettings = {
  token: "",
  organization: "gearsandcode",
  repository: "docs",
  label: "figma-plugin",
  commitData: undefined,
};

export async function saveSettings(settings: Partial<StoredSettings>) {
  console.log("Saving settings:", settings);
  const currentSettings = (await loadSettings()) || DEFAULT_SETTINGS;

  // Properly merge commitData
  const mergedSettings = {
    ...currentSettings,
    ...settings,
    commitData: settings.commitData
      ? { ...currentSettings.commitData, ...settings.commitData }
      : currentSettings.commitData,
  };

  console.log("Merged settings:", mergedSettings);
  await figma.clientStorage.setAsync("github-settings", mergedSettings);
  return mergedSettings;
}

export async function loadSettings(): Promise<StoredSettings | null> {
  const settings = await figma.clientStorage.getAsync("github-settings");
  console.log("Loaded settings:", settings);
  return settings;
}
