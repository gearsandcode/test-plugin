/// <reference types="@figma/plugin-typings" />
import {
  saveSettings,
  loadSettings,
  type StoredSettings,
} from "./PluginStore.js";

const pluginDefaultWidth = 500;
const pluginDefaultHeight = 600;
const pluginMaxHeight = 1200;
const pluginMinWidth = 300;

interface PluginMessage {
  type:
    | "save-settings"
    | "load-settings"
    | "create-commit"
    | "resize"
    | "save-commit-data";
  settings?: StoredSettings;
  success?: boolean;
  size?: { w: number; h: number };
  payload?: any;
}

figma.showUI(__html__, {
  width: pluginDefaultWidth,
  height: pluginDefaultHeight,
  title: "GitHub Commit Creator",
  themeColors: true,
});

// Restore previous size when reopen the plugin
figma.clientStorage
  .getAsync("size")
  .then((size) => {
    if (size) figma.ui.resize(size.w, size.h);
  })
  .catch((err) => console.error("Error loading size:", err));

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case "save-settings": {
      if (!msg.settings) {
        figma.notify("Settings are undefined and cannot be saved.", {
          error: true,
        });
        return;
      }

      try {
        const currentSettings = await loadSettings();
        const newSettings = {
          ...currentSettings,
          ...msg.settings,
          commitData: {
            ...currentSettings?.commitData,
            ...msg.settings.commitData,
          },
        };
        await saveSettings(newSettings);

        // Load and send back the saved settings to verify
        const savedSettings = await loadSettings();
        figma.ui.postMessage({
          type: "settings-loaded",
          settings: savedSettings,
        });

        figma.notify("Settings saved!");
      } catch (error) {
        console.error("Error saving settings:", error);
        figma.notify("Error saving settings", { error: true });
      }
      break;
    }

    case "load-settings": {
      try {
        const settings = await loadSettings();
        figma.ui.postMessage({ type: "settings-loaded", settings });
      } catch (error) {
        console.error("Error loading settings:", error);
        figma.notify("Error loading settings", { error: true });
      }
      break;
    }

    case "create-commit":
      if (msg.success) {
        figma.notify("Successfully created commit! 🎉");
      }
      break;

    case "resize":
      if (msg.size) {
        let { w, h } = msg.size;

        // Apply constraints
        h = Math.min(Math.max(h, pluginDefaultHeight), pluginMaxHeight);
        w = Math.max(w, pluginMinWidth);

        figma.ui.resize(w, h);
        figma.clientStorage.setAsync("size", { w, h }).catch((err) => {
          console.error("Error saving size:", err);
        });
      }
      break;

    default:
      console.log("Unknown message type:", msg.type);
  }
};
