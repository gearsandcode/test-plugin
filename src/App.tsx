import { useState, useEffect } from "react";
import { Gear, Spinner } from "@phosphor-icons/react";
import { CommitForm, SettingsForm, TabButton } from "./components";
import { ResizeHandle } from "./components/ResizeHandle";
import { useGitHubSettings } from "./hooks/useGitHubSettings";

export function App() {
  const [activeTab, setActiveTab] = useState<"commit" | "settings">("commit");
  const { settings, loading, saveSettings, updateCommitData } =
    useGitHubSettings();

  const hasRequiredSettings =
    settings?.token && settings?.organization && settings?.repository;

  useEffect(() => {
    if (!hasRequiredSettings && !loading) {
      setActiveTab("settings");
    }
  }, [hasRequiredSettings, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-none">
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
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }
                  transition-opacity
                `}
              >
                <Gear size={16} />
              </button>
            </div>
          ) : (
            <h1 className="text-sm font-medium">GitHub Commit Creator</h1>
          )}
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"></div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "settings" ? (
          <SettingsForm initialSettings={settings} onSave={saveSettings} />
        ) : hasRequiredSettings ? (
          <CommitForm
            settings={settings!}
            onUpdateCommitData={updateCommitData}
          />
        ) : (
          <div className="p-4">
            <p className="text-sm opacity-50">
              Please configure your settings to continue.
            </p>
          </div>
        )}
      </div>

      <ResizeHandle />
    </div>
  );
}
