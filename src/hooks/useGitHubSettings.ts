/**
 * @fileoverview Hook for managing GitHub settings with commit data persistence
 */

import { useState, useEffect } from "react";
import type { StoredSettings, CommitData } from "../types";

export function useGitHubSettings() {
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "settings-loaded") {
        setSettings(msg.settings);
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    parent.postMessage({ pluginMessage: { type: "load-settings" } }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const saveSettings = async (newSettings: Partial<StoredSettings>) => {
    // Merge with existing commit data if it exists
    const updatedSettings = {
      ...newSettings,
      commitData: {
        ...(settings?.commitData || {}),
        ...(newSettings.commitData || {}),
      },
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: updatedSettings,
        },
      },
      "*"
    );

    // Update local state optimistically
    setSettings(
      (prev) =>
        ({
          ...(prev || {}),
          ...updatedSettings,
        } as StoredSettings)
    );
  };

  // Helper function to update commit data
  const updateCommitData = async (commitData: Partial<CommitData>) => {
    if (!settings) return;

    const updatedSettings: StoredSettings = {
      ...settings,
      commitData: {
        ...settings.commitData,
        ...commitData,
      },
    };

    await saveSettings(updatedSettings);
  };

  return {
    settings,
    loading,
    saveSettings,
    updateCommitData,
  };
}
