import { useState, useEffect } from "react";
import { Gear } from "@phosphor-icons/react";
import {
  SettingsForm,
  TabButton,
  ResizeHandle,
  PullRequestForm,
  VariableFlowView,
  VariablesTableView,
} from "./components";
import { useGitHubSettings } from "./hooks/useGitHubSettings";
import type { StoredSettings, VariableCollection } from "./types";
import { notify } from "./utils";

export function App() {
  const [activeTab, setActiveTab] = useState<
    "variables" | "commit-changes" | "settings" | "compare"
  >("variables");
  const [variables, setVariables] = useState<VariableCollection[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [variablesLoading, setVariablesLoading] = useState(true);
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "flow">("list");
  const settingsManager = useGitHubSettings();
  const hasRequiredSettings =
    settings?.token && settings?.organization && settings?.repository;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === "settings-loaded") {
        setSettings(msg.settings);
        setLoading(false);
      }

      if (msg.type === "variables-loaded") {
        setVariables(msg.variables);
        setExportData(msg.exportData);
        setVariablesLoading(false);
      }
    }

    window.addEventListener("message", handleMessage);
    settingsManager.loadSettings();

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (hasRequiredSettings) {
      setVariablesLoading(true);
      parent.postMessage({ pluginMessage: { type: "get-variables" } }, "*");
    }
  }, [hasRequiredSettings]);

  useEffect(() => {
    if (!hasRequiredSettings && !loading) {
      setActiveTab("settings");
    }
  }, [hasRequiredSettings, loading]);

  const handleSaveSettings = async (newSettings: Partial<StoredSettings>) => {
    try {
      await settingsManager.saveSettings(newSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
      notify("Failed to save settings");
    }
  };

  const handleRefreshVariables = () => {
    if (!hasRequiredSettings) return;

    setVariablesLoading(true);
    parent.postMessage(
      {
        pluginMessage: { type: "get-variables" },
      },
      "*"
    );
  };

  if (loading) {
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
      <div className="flex gap-2 p-4 border-b border-figma-border sticky top-0 bg-figma-bg z-50">
        <button
          onClick={() => setView("list")}
          className={`px-3 py-1 rounded ${
            view === "list" ? "bg-figma-bg-active" : "bg-figma-bg-hover"
          }`}
        >
          List View
        </button>
        {/* <button
          onClick={() => setView("flow")}
          className={`px-3 py-1 rounded ${
            view === "flow" ? "bg-figma-bg-active" : "bg-figma-bg-hover"
          }`}
        >
          Flow View
        </button> */}
      </div>

      {view === "list" ? (
        <>
          <div className="flex-none">
            <div className="px-4 py-2 flex items-center">
              {hasRequiredSettings ? (
                <div className="flex items-center w-full">
                  <TabButton
                    label="Variables"
                    active={activeTab === "variables"}
                    onClick={() => setActiveTab("variables")}
                  />
                  {/* <TabButton
                    label="Compare"
                    active={activeTab === "compare"}
                    onClick={() => setActiveTab("compare")}
                  /> */}
                  <TabButton
                    label="Commit changes"
                    active={activeTab === "commit-changes"}
                    onClick={() => setActiveTab("commit-changes")}
                  />
                  <TabButton
                    label="Github Settings"
                    active={activeTab === "settings"}
                    onClick={() => setActiveTab("settings")}
                  />
                </div>
              ) : (
                <h1 className="text-sm font-medium">GitHub Variables Sync</h1>
              )}
            </div>
            <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"></div>
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === "settings" ? (
              <SettingsForm
                initialSettings={settings}
                onSave={handleSaveSettings}
              />
            ) : // ) : activeTab === "compare" ? (
            //   <CompareView
            //     settings={settings!}
            //     content={JSON.stringify(exportData, null, 2)}
            //   />
            activeTab === "commit-changes" ? (
              <PullRequestForm
                settings={settings!}
                onCancel={() => setActiveTab("variables")}
                content={JSON.stringify(exportData, null, 2)}
              />
            ) : hasRequiredSettings ? (
              <VariablesTableView
                variables={variables}
                loading={variablesLoading}
                onRefresh={handleRefreshVariables}
              />
            ) : (
              <div className="p-4">
                <p className="text-sm opacity-50">
                  Please configure your settings to continue.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* <VariableFlowView /> */}
          <VariableFlowView
            collections={variables.map((collection) => ({
              ...collection,
              modes: collection.modes.reduce(
                (acc, mode) => ({ ...acc, [mode]: {} }),
                {}
              ),
              variables: collection.variables.map((variable) => ({
                ...variable,
                description: variable.description || "",
                value: "",
                displayValue: "",
              })),
            }))}
          />
          {/* <Flow
            collections={variables.map((collection) => ({
              ...collection,
              modes: collection.modes.reduce(
                (acc, mode) => ({ ...acc, [mode]: {} }),
                {}
              ),
              variables: collection.variables.map((variable) => ({
                ...variable,
                description: variable.description || "",
                value: "",
                displayValue: "",
              })),
            }))}
          /> */}
        </div>
      )}
      <ResizeHandle />
    </div>
  );
}
