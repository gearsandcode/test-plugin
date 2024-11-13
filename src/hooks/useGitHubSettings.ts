import { useState, useEffect } from "react";
import type { StoredSettings } from "../PluginStore";

export const useGitHubSettings = () => {
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
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: newSettings,
        },
      },
      "*"
    );
  };

  return {
    settings,
    loading,
    saveSettings,
  };
};
