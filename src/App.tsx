import { useState, useEffect, useCallback } from "react";
import { Gear, ArrowsClockwise } from "@phosphor-icons/react";
import {
  SettingsForm,
  TabButton,
  ResizeHandle,
  PullRequestForm,
  VariableFlowView,
  VariablesTableView,
  ViewLocalChanges,
  Alert,
} from "./components";
import { useGitHubSettings } from "./hooks/useGitHubSettings";
import type { StoredSettings, VariableCollection, NestedGroup } from "./types";
import { createNestedGroups, notify } from "./utils";

interface ViewState {
  activeView: "list" | "flow";
  selectedCollection: string;
  selectedGroup: string | null;
}

export function App() {
  const [activeTab, setActiveTab] = useState<
    "variables" | "commit-changes" | "settings" | "compare" | "local-changes"
  >("variables");
  const [variables, setVariables] = useState<VariableCollection[]>([]);
  const [variablesLoading, setVariablesLoading] = useState(true);
  const [styles, setStyles] = useState<any[]>([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [exportData, setExportData] = useState<any>(null);
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "flow">("list");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const settingsManager = useGitHubSettings();
  const hasRequiredSettings =
    settings?.token && settings?.organization && settings?.repository;
  const [groups, setGroups] = useState<Map<string, NestedGroup>>(new Map());

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case "settings-loaded":
          setSettings(msg.settings);
          setLoading(false);
          // After settings are loaded, load view state
          parent.postMessage(
            { pluginMessage: { type: "load-view-state" } },
            "*"
          );
          break;

        case "view-state-reset": {
          // Reset all view states
          setView("list");
          setSelectedCollection(variables.length > 0 ? variables[0].name : "");
          setSelectedGroup(null);
          setGroups(new Map()); // Reset groups expansion state

          // Force re-initialization of groups if needed
          if (variables.length > 0) {
            const firstCollection = variables.find(
              (v) => v.name === variables[0].name
            );
            if (firstCollection?.variables) {
              setGroups(createNestedGroups(firstCollection.variables));
            }
          }
          break;
        }

        case "variables-loaded": {
          setVariables(msg.variables);
          setExportData(msg.exportData);
          setVariablesLoading(false);

          // Load view state after variables are loaded
          parent.postMessage(
            { pluginMessage: { type: "load-view-state" } },
            "*"
          );
          break;
        }

        case "view-state-loaded": {
          if (msg.state) {
            setView(msg.state.activeView || "list");
            // Only set collection if it exists in current variables
            if (
              variables.some((v) => v.name === msg.state.selectedCollection)
            ) {
              setSelectedCollection(msg.state.selectedCollection);
              setSelectedGroup(msg.state.selectedGroup);
            } else if (variables.length > 0) {
              // Fallback to first collection if saved one doesn't exist
              setSelectedCollection(variables[0].name);
              setSelectedGroup(null);
            }
          }
          break;
        }

        case "styles-loaded":
          setStyles(msg.styles);
          setStylesLoading(false);
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    settingsManager.loadSettings();

    return () => window.removeEventListener("message", handleMessage);
  }, [variables]);

  // Save view state when it changes
  useEffect(() => {
    if (selectedCollection) {
      saveViewState({
        activeView: view,
        selectedCollection,
        selectedGroup,
      });
    }
  }, [view, selectedCollection, selectedGroup]);

  // Effect for loading variables
  useEffect(() => {
    if (hasRequiredSettings) {
      setVariablesLoading(true);
      parent.postMessage({ pluginMessage: { type: "get-variables" } }, "*");
    }
  }, [hasRequiredSettings]);

  // Add new effect for loading styles
  useEffect(() => {
    if (hasRequiredSettings) {
      setStylesLoading(true);
      parent.postMessage({ pluginMessage: { type: "get-styles" } }, "*");
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

  // Add debug logging
  useEffect(() => {
    console.log("Loading states:", {
      variablesLoading,
      stylesLoading,
      loading,
    });
  }, [variablesLoading, stylesLoading, loading]);

  // Save view state when it changes
  const saveViewState = useCallback((state: ViewState) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-view-state",
          state,
        },
      },
      "*"
    );
  }, []);

  // Update view state handlers
  const handleViewChange = (newView: "list" | "flow") => {
    setView(newView);
    saveViewState({
      activeView: newView,
      selectedCollection,
      selectedGroup,
    });
  };

  const handleCollectionChange = (collection: string) => {
    setSelectedCollection(collection);
    saveViewState({
      activeView: view,
      selectedCollection: collection,
      selectedGroup,
    });
  };

  const handleGroupChange = (group: string | null) => {
    setSelectedGroup(group);
    saveViewState({
      activeView: view,
      selectedCollection,
      selectedGroup: group,
    });
  };

  const handleRefreshData = useCallback(() => {
    if (!hasRequiredSettings) return;

    // Reset loading states
    setVariablesLoading(true);
    setStylesLoading(true);

    // Request data updates
    parent.postMessage({ pluginMessage: { type: "get-variables" } }, "*");
    parent.postMessage({ pluginMessage: { type: "get-styles" } }, "*");
  }, [hasRequiredSettings]);

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
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center">
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
                      label="View local collections"
                      active={activeTab === "local-changes"}
                      onClick={() => setActiveTab("local-changes")}
                    />
                    <TabButton
                      label="Github Settings"
                      active={activeTab === "settings"}
                      onClick={() => setActiveTab("settings")}
                    />
                  </div>
                  <button
                    onClick={handleRefreshData}
                    disabled={variablesLoading || stylesLoading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium
                      ${
                        variablesLoading || stylesLoading
                          ? "bg-figma-bg-hover opacity-50 cursor-not-allowed"
                          : "bg-figma-bg-hover hover:bg-figma-bg-active"
                      } transition-colors`}
                    title="Refresh variables"
                  >
                    <ArrowsClockwise
                      className={`w-4 h-4 ${
                        variablesLoading || stylesLoading ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh variables</span>
                  </button>
                </div>
              ) : (
                <h1 className="text-sm font-medium">GitHub Variables Sync</h1>
              )}
            </div>
            <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"></div>
          </div>

          <div className="flex-1 overflow-auto">
            {variablesLoading || stylesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Alert
                  type="loading"
                  message={
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-stone-300 border-t-stone-600" />
                      <span className="text-xs opacity-80">
                        {variablesLoading
                          ? "Getting new variables..."
                          : "Getting new styles..."}
                      </span>
                    </div>
                  }
                />
              </div>
            ) : (
              <>
                {activeTab === "local-changes" && (
                  <ViewLocalChanges
                    variables={variables}
                    styles={styles} // Add styles to your state management
                  />
                )}

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
                    selectedCollection={selectedCollection}
                    selectedGroup={selectedGroup}
                    onCollectionChange={setSelectedCollection}
                    onGroupChange={setSelectedGroup}
                    view={view}
                    onViewChange={setView}
                  />
                ) : (
                  <div className="p-4">
                    <p className="text-sm opacity-50">
                      Please configure your settings to continue.
                    </p>
                  </div>
                )}
              </>
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
