import { useState, useEffect } from "react";
import { Gear } from "@phosphor-icons/react";
import {
  SettingsForm,
  TabButton,
  ResizeHandle,
  VariablesDisplay,
  PullRequestForm,
} from "./components";
import { useGitHubSettings } from "./hooks/useGitHubSettings";
import { useGitHubPR } from "./hooks/useGitHubPR";
import type { PRFormData } from "./types";

type AppTab = "variables" | "settings";

interface Variable {
  name: string;
  value: string;
  description?: string;
  type: string;
}

interface VariableCollection {
  collection: string;
  variables: Variable[];
}

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("variables");
  const [showPRForm, setShowPRForm] = useState(false);
  const [variables, setVariables] = useState<VariableCollection[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [variablesLoading, setVariablesLoading] = useState(true);

  const {
    settings,
    loading: settingsLoading,
    saveSettings,
  } = useGitHubSettings();

  const { createPR, loading: prLoading } = useGitHubPR(
    settings || {
      token: "",
      organization: "",
      repository: "",
      label: "",
    }
  );

  const hasRequiredSettings =
    settings?.token && settings?.organization && settings?.repository;

  // Load variables from Figma
  useEffect(() => {
    if (hasRequiredSettings) {
      parent.postMessage({ pluginMessage: { type: "get-variables" } }, "*");
    }
  }, [hasRequiredSettings]);

  // Handle messages from the plugin
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data.pluginMessage;
      if (!message) return;

      if (message.type === "variables-loaded") {
        setVariables(message.variables);
        setExportData(message.exportData);
        setVariablesLoading(false);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Automatically show settings if they're not configured
  useEffect(() => {
    if (!hasRequiredSettings && !settingsLoading) {
      setActiveTab("settings");
    }
  }, [hasRequiredSettings, settingsLoading]);

  const handleCreatePR = async (formData: PRFormData) => {
    if (!exportData) {
      figma.notify("No variables data available", { error: true });
      return;
    }

    try {
      await createPR({
        ...formData,
        content: JSON.stringify(exportData, null, 2),
        label: settings?.label,
      });

      setShowPRForm(false);
      figma.notify("Successfully created pull request!");
    } catch (error) {
      console.error("Failed to create PR:", error);
      figma.notify("Failed to create pull request", { error: true });
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <Gear className="w-6 h-6 opacity-50" />
        </div>
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
                label="Variables"
                active={activeTab === "variables"}
                onClick={() => setActiveTab("variables")}
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
            <h1 className="text-sm font-medium">GitHub Variables Sync</h1>
          )}
        </div>

        <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"></div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "settings" ? (
          <SettingsForm initialSettings={settings} onSave={saveSettings} />
        ) : showPRForm ? (
          <PullRequestForm
            settings={settings!}
            onCancel={() => setShowPRForm(false)}
            onSubmit={handleCreatePR}
            loading={prLoading}
          />
        ) : hasRequiredSettings ? (
          <VariablesDisplay
            variables={variables}
            loading={variablesLoading}
            onCreatePR={() => setShowPRForm(true)}
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
