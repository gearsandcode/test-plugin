/**
 * @fileoverview Basic JavaScript plugin storage functionality
 * @packageDocumentation
 */

import type { StoredSettings, CommitData } from "./types";

const DEFAULT_COMMIT_DATA: CommitData = {
  branch: "",
  message: "",
  filename: "test.md",
  content: "",
};

const DEFAULT_SETTINGS: StoredSettings = {
  token: "",
  organization: "gearsandcode",
  repository: "docs",
  label: "figma-plugin",
  commitData: DEFAULT_COMMIT_DATA,
};

/**
 * Updates commitData with new values while preserving existing ones
 */
function updateCommitData(
  current: Partial<CommitData> | undefined,
  updates: Partial<CommitData> | undefined
): CommitData {
  const currentData = {
    branch: "",
    message: "",
    filename: "test.md",
    content: "",
  };

  // Apply current values if they exist
  if (current) {
    if (current.branch) currentData.branch = current.branch;
    if (current.message) currentData.message = current.message;
    if (current.filename) currentData.filename = current.filename;
    if (current.content) currentData.content = current.content;
  }

  // Apply updates if they exist
  if (updates) {
    if (updates.branch !== undefined) currentData.branch = updates.branch;
    if (updates.message !== undefined) currentData.message = updates.message;
    if (updates.filename !== undefined) currentData.filename = updates.filename;
    if (updates.content !== undefined) currentData.content = updates.content;
  }

  return currentData;
}

/**
 * Updates settings with new values while preserving existing ones
 */
function updateSettings(
  current: StoredSettings,
  updates: Partial<StoredSettings>
): StoredSettings {
  const newSettings = {
    token: current.token,
    organization: current.organization,
    repository: current.repository,
    label: current.label,
    commitData: current.commitData,
  };

  if (updates.token !== undefined) newSettings.token = updates.token;
  if (updates.organization !== undefined)
    newSettings.organization = updates.organization;
  if (updates.repository !== undefined)
    newSettings.repository = updates.repository;
  if (updates.label !== undefined) newSettings.label = updates.label;

  newSettings.commitData = updateCommitData(
    current.commitData,
    updates.commitData
  );

  return newSettings;
}

export async function saveSettings(
  settings: Partial<StoredSettings>
): Promise<StoredSettings> {
  try {
    const currentSettings = await loadSettings();
    const newSettings = updateSettings(currentSettings, settings);
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

    return updateSettings(
      DEFAULT_SETTINGS,
      settings as Partial<StoredSettings>
    );
  } catch (error) {
    console.error("Error in loadSettings:", error);
    return DEFAULT_SETTINGS;
  }
}
