/// <reference types="@figma/plugin-typings" />
import {
  saveSettings,
  loadSettings,
  type StoredSettings,
  CommitData,
} from "./PluginStore.js";

const pluginDefaultWidth = 500;
const pluginDefaultHeight = 600;
const pluginMaxHeight = 1200;
const pluginMinWidth = 300;

figma.showUI(__html__, {
  width: pluginDefaultWidth,
  height: pluginDefaultHeight,
  title: "GitHub Commit Creator",
  themeColors: true,
});

figma.clientStorage
  .getAsync("size")
  .then((size) => {
    if (size) figma.ui.resize(size.w, size.h);
  })
  .catch((err) => {
    console.error("Error loading size:", err);
  });

figma.ui.onmessage = async (msg) => {
  console.log("Plugin received message:", msg);

  switch (msg.type) {
    case "save-settings": {
      if (msg.settings) {
        console.log("Saving settings:", msg.settings);
        const savedSettings = await saveSettings(msg.settings);
        console.log("Settings saved:", savedSettings);

        // Send back the saved settings to ensure UI is in sync
        figma.ui.postMessage({
          type: "settings-saved",
          settings: savedSettings,
        });
      } else {
        console.error("Settings are undefined and cannot be saved.");
        figma.notify("Settings are undefined and cannot be saved.", {
          error: true,
        });
      }
      break;
    }

    case "load-settings": {
      console.log("Loading settings...");
      const settings = await loadSettings();
      console.log("Loaded settings:", settings);
      figma.ui.postMessage({ type: "settings-loaded", settings });
      break;
    }

    case "save-commit-data": {
      console.log("Saving commit data:", msg.payload);
      const currentSettings = await loadSettings();
      if (currentSettings) {
        const updatedSettings = {
          ...currentSettings,
          commitData: msg.payload as CommitData,
        };
        await saveSettings(updatedSettings);
        // Send back updated settings
        figma.ui.postMessage({
          type: "settings-saved",
          settings: updatedSettings,
        });
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
        if (msg.size.h > pluginMaxHeight) {
          msg.size.h = pluginMaxHeight;
        } else if (msg.size.h < pluginDefaultHeight) {
          msg.size.h = pluginDefaultHeight;
        }

        if (msg.size.w < pluginMinWidth) {
          msg.size.w = pluginMinWidth;
        }

        figma.ui.resize(msg.size.w, msg.size.h);
        figma.clientStorage.setAsync("size", msg.size).catch((err) => {
          console.error("Error saving size:", err);
        });
      }
      break;

    default:
      console.log("Unknown message type:", msg.type);
  }
};
