import React, { useState, useEffect } from "react";
import CommitForm from "./components/CommitForm.js";
import SettingsForm from "./components/SettingsForm.js";
import type { StoredSettings } from "./PluginStore.js";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"settings" | "commit">("settings");
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-settings" } }, "*");

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "settings-loaded") {
        // Preserve the existing commitData when updating settings
        setSettings((prevSettings) => ({
          ...msg.settings,
          commitData: msg.settings.commitData || prevSettings?.commitData,
        }));
        setLoading(false);
        if (msg.settings?.token) {
          setActiveTab("commit");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSettingsSaved = (newSettings: StoredSettings) => {
    // Preserve the existing commitData when saving settings
    setSettings((prevSettings) => ({
      ...newSettings,
      commitData: prevSettings?.commitData || newSettings.commitData,
    }));
    setActiveTab("commit");
  };

  const TabButton: React.FC<{
    tab: "settings" | "commit";
    label: string;
    disabled?: boolean;
  }> = ({ tab, label, disabled }) => (
    <button
      onClick={() => setActiveTab(tab)}
      disabled={disabled}
      className={`
        px-3 py-1 text-xs
        ${
          activeTab === tab
            ? "bg-blue-500 text-white"
            : "bg-black/5 text-black/50 hover:bg-black/10"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        transition-colors rounded-sm
      `}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-xs text-black/50">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-black/10">
        <div className="px-4 py-2 flex space-x-2">
          <TabButton tab="settings" label="Settings" />
          <TabButton tab="commit" label="Commit" disabled={!settings?.token} />
        </div>
      </div>

      {activeTab === "settings" ? (
        <SettingsForm initialSettings={settings} onSave={handleSettingsSaved} />
      ) : (
        settings && <CommitForm settings={settings} />
      )}
    </div>
  );
};

export default App;
