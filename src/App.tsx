import React, { useState, useEffect } from "react";
// todo - troubleshoot - see: https://github.com/phosphor-icons/react/issues/96
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import CommitForm from "./components/CommitForm.js";
import SettingsForm from "./components/SettingsForm.js";
import type { StoredSettings } from "./PluginStore.js";
import ResizeHandle from "./components/ResizableCorner.js";

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-3 py-1.5 text-xs
      ${active ? "bg-blue-500 text-white" : "hover:bg-black/5"}
      transition-colors rounded-sm
    `}
  >
    {label}
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"commit" | "settings">("commit");
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const hasRequiredSettings =
    settings?.token && settings?.organization && settings?.repository;

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-settings" } }, "*");

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "settings-loaded") {
        setSettings(msg.settings);
        setLoading(false);

        const hasSettings =
          msg.settings?.token &&
          msg.settings?.organization &&
          msg.settings?.repository;
        setActiveTab(hasSettings ? "commit" : "settings");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSettingsSaved = (newSettings: StoredSettings) => {
    setSettings(newSettings);
    if (
      newSettings.token &&
      newSettings.organization &&
      newSettings.repository
    ) {
      setActiveTab("commit");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-xs opacity-50">Loading settings...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b">
        <div className="px-4 py-2 flex justify-between items-center">
          {hasRequiredSettings ? (
            <div className="flex items-center justify-between w-full">
              <TabButton
                label="Commit"
                active={activeTab === "commit"}
                onClick={() => setActiveTab("commit")}
              />
              <button
                onClick={() => setActiveTab("settings")}
                className={`
                  p-2 rounded-sm
                  ${
                    activeTab === "settings"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-black/5"
                  }
                  transition-colors
                `}
              >
                <GithubLogo
                  size={16}
                  weight={activeTab === "settings" ? "fill" : "regular"}
                />
              </button>
            </div>
          ) : (
            <h1 className="text-sm font-medium">GitHub Commit Creator</h1>
          )}
        </div>
      </div>

      {activeTab === "settings" ? (
        <SettingsForm initialSettings={settings} onSave={handleSettingsSaved} />
      ) : hasRequiredSettings ? (
        <CommitForm settings={settings!} />
      ) : (
        <div className="p-4">
          <p className="text-sm opacity-50">
            Please configure your settings to continue.
          </p>
        </div>
      )}
      <ResizeHandle />
    </div>
  );
};

export default App;
