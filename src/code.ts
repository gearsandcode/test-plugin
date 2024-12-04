import { saveSettings, loadSettings } from "./PluginStore";

const pluginDefaultWidth = 500;
const pluginDefaultHeight = 600;
const pluginMaxHeight = 1200;
const pluginMinWidth = 300;

figma.showUI(__html__, {
  width: pluginDefaultWidth,
  height: pluginDefaultHeight,
  title: "GitHub Variables Sync",
  themeColors: true,
});

interface FormattedVariable {
  name: string;
  displayValue: string;
  resolvedValue?: string;
  resolvedName?: string;
  hexColor?: string;
  type: VariableResolvedDataType;
  description?: string;
}

interface FormattedCollection {
  name: string;
  variables: FormattedVariable[];
}

interface ExportVariable {
  value: string;
  type: VariableResolvedDataType;
  description?: string;
  resolvedFrom?: string;
}

interface ExportData {
  [collectionName: string]: {
    [variableName: string]: ExportVariable;
  };
}

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

async function resolveVariableAlias(alias: VariableAlias): Promise<{
  value: VariableValue;
  name: string;
  resolvedType: VariableResolvedDataType;
} | null> {
  const variable = await figma.variables.getVariableByIdAsync(alias.id);
  if (!variable) return null;

  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  if (typeof value === "object" && "id" in value) {
    return resolveVariableAlias(value);
  }

  return {
    value,
    name: variable.name,
    resolvedType: variable.resolvedType,
  };
}

function rgbaToHex(color: RGBA): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  return color.a !== 1 ? `${hex}${toHex(color.a)}` : hex;
}

async function formatVariableValue(
  variable: Variable,
  value?: VariableValue,
  resolvedType?: VariableResolvedDataType
): Promise<{
  displayValue: string;
  resolvedValue?: string;
  resolvedName?: string;
  hexColor?: string;
  type: VariableResolvedDataType;
}> {
  // If value and type are provided, use them directly (for resolved aliases)
  const actualValue =
    value || variable.valuesByMode[Object.keys(variable.valuesByMode)[0]];
  const actualType = resolvedType || variable.resolvedType;

  if (typeof actualValue === "object" && "id" in actualValue) {
    const resolved = await resolveVariableAlias(actualValue);
    if (!resolved)
      return {
        displayValue: "Unresolved reference",
        type: actualType,
      };

    // Format the resolved value by passing it directly
    const formattedResolved = await formatVariableValue(
      variable,
      resolved.value,
      resolved.resolvedType
    );

    return {
      displayValue: formattedResolved.displayValue,
      resolvedValue: formattedResolved.displayValue,
      resolvedName: resolved.name,
      hexColor: formattedResolved.hexColor,
      type: resolved.resolvedType,
    };
  }

  if (actualType === "COLOR") {
    const color = actualValue as RGBA;
    const hex = rgbaToHex(color);
    return {
      displayValue: hex,
      hexColor: hex,
      type: "COLOR",
    };
  }

  return {
    displayValue: String(actualValue),
    type: actualType,
  };
}

async function getAllFormattedVariables(): Promise<{
  collections: FormattedCollection[];
  exportData: ExportData;
}> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const formattedCollections: FormattedCollection[] = [];

  for (const collection of collections) {
    const variables: FormattedVariable[] = [];

    for (const id of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (!variable || variable.remote) continue;

      try {
        const formatted = await formatVariableValue(variable);
        const formattedVariable: FormattedVariable = {
          name: variable.name,
          displayValue: formatted.displayValue,
          resolvedValue: formatted.resolvedValue,
          resolvedName: formatted.resolvedName,
          hexColor: formatted.hexColor,
          type: formatted.type,
          description: variable.description || undefined,
        };
        variables.push(formattedVariable);
      } catch (err) {
        console.error(`Error formatting variable ${variable.name}:`, err);
      }
    }

    if (variables.length > 0) {
      formattedCollections.push({
        name: collection.name,
        variables: variables,
      });
    }
  }

  // Format export data
  const exportData: ExportData = {};
  for (const collection of formattedCollections) {
    const variables: { [key: string]: ExportVariable } = {};
    for (const variable of collection.variables) {
      variables[variable.name] = {
        value: variable.displayValue,
        type: variable.type,
        description: variable.description,
        resolvedFrom: variable.resolvedName,
      };
    }
    exportData[collection.name] = variables;
  }

  return { collections: formattedCollections, exportData };
}

// Initialize size on startup
initializeSize();

// color/green: #6a8924

figma.ui.onmessage = async (msg) => {
  if (msg.type === "load-group-states") {
    try {
      const states = await figma.clientStorage.getAsync(msg.key);
      figma.ui.postMessage({
        type: "group-states-loaded",
        states,
      });
    } catch (error) {
      console.error("Failed to load group states:", error);
      figma.ui.postMessage({
        type: "group-states-loaded",
        states: {},
      });
    }
  }

  if (msg.type === "save-group-states") {
    try {
      await figma.clientStorage.setAsync(msg.key, msg.states);
    } catch (error) {
      console.error("Failed to save group states:", error);
    }
  }

  if (msg.type === "clear-all-data") {
    try {
      // Clear all clientStorage
      await figma.clientStorage.setAsync("github-settings", null);
      await figma.clientStorage.setAsync("size", null);
      // Add any other stored data keys here

      // Clear document data if needed
      // figma.root.setPluginData("key", "");

      // Notify UI of success
      figma.notify("All settings and stored data cleared");
    } catch (err) {
      console.error("Error clearing data:", err);
      figma.notify("Error clearing data", { error: true });
    }
  }

  if (msg.type === "notify") {
    figma.notify(msg.message, { error: msg.error });
    return;
  }

  if (msg.type === "resize" && msg.size) {
    const w = Math.max(msg.size.w, pluginMinWidth);
    const h = Math.min(
      Math.max(msg.size.h, pluginDefaultHeight),
      pluginMaxHeight
    );

    figma.ui.resize(w, h);

    try {
      await figma.clientStorage.setAsync("size", { w: w, h: h });
    } catch (err) {
      console.error("Error saving size:", err);
    }
    return;
  }

  if (msg.type === "get-variables") {
    try {
      const result = await getAllFormattedVariables();
      figma.ui.postMessage({
        type: "variables-loaded",
        variables: result.collections,
        exportData: result.exportData,
      });
    } catch (error) {
      console.error("Error loading variables:", error);
      figma.notify("Error loading variables", { error: true });
    }
  } else if (msg.type === "create-pr") {
    try {
      const result = await getAllFormattedVariables();
      const prData = {
        title: msg.data.title,
        branch: msg.data.branch,
        description: msg.data.description,
        baseBranch: msg.data.baseBranch,
        label: msg.data.label,
        variablesJson: JSON.stringify(result.exportData, null, 2),
      };

      figma.ui.postMessage({
        type: "create-pr-with-data",
        data: prData,
      });
    } catch (error) {
      console.error("Error creating PR:", error);
      figma.notify("Error creating pull request", { error: true });
    }
  } else if (msg.type === "save-settings") {
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
  }
};
