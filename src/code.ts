import { saveSettings, loadSettings } from "./PluginStore";

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

// Restore previous size
async function initializeSize() {
  try {
    const size = await figma.clientStorage.getAsync("size");
    if (size) {
      figma.ui.resize(size.w, size.h);
    }
  } catch (err) {
    console.error("Error loading size:", err);
  }
}

// Initialize size on startup
initializeSize();

figma.ui.onmessage = async (msg) => {
  // Handle resize message
  if (msg.type === "resize" && msg.size) {
    const w = Math.max(msg.size.w, pluginMinWidth);
    const h = Math.min(
      Math.max(msg.size.h, pluginDefaultHeight),
      pluginMaxHeight
    );

    figma.ui.resize(w, h);

    try {
      await figma.clientStorage.setAsync("size", { w, h });
    } catch (err) {
      console.error("Error saving size:", err);
    }
    return;
  }

  // Handle settings messages
  if (msg.type === "save-settings") {
    if (!msg.settings) {
      figma.notify("Settings are undefined", { error: true });
      return;
    }

    try {
      const savedSettings = await saveSettings(msg.settings);
      figma.ui.postMessage({
        type: "settings-loaded",
        settings: savedSettings,
      });
      figma.notify("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      figma.notify("Error saving settings", { error: true });
    }
  } else if (msg.type === "load-settings") {
    try {
      const settings = await loadSettings();
      figma.ui.postMessage({
        type: "settings-loaded",
        settings: settings,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      figma.notify("Error loading settings", { error: true });
    }
  } else if (msg.type === "create-commit") {
    if (msg.success) {
      figma.notify("Successfully created commit!");
    }
  }
};
