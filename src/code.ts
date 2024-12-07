import { saveSettings, loadSettings } from "./PluginStore";
import { LocalVariable } from "@figma/rest-api-spec";

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

interface FormattedVariable extends LocalVariable {
  name: string;
  displayValue?: string;
  resolvedValue?: string;
  resolvedName?: string;
  hexColor?: string;
  type: string;
  description: string;
  modes: Record<
    string,
    {
      displayValue: string;
      value: VariableAlias | string;
      resolvedValue?: string;
      resolvedName?: string;
      hexColor?: string;
      type: string;
    }
  >;
}

interface VariableMode {
  displayValue: string;
  value: VariableAlias | string;
  resolvedValue?: string;
  resolvedName?: string;
  hexColor?: string;
  type: string;
}

interface FormattedCollection {
  name: string;
  modes: string[];
  variables: FormattedVariable[];
}

interface ExportVariable {
  $value: string;
  $type: string;
  $description?: string;
  $resolvedFrom?: string;
}

interface ExportModeData {
  [variableName: string]: ExportVariable;
}
interface ExportData {
  [collectionName: string]:
    | {
        [modeName: string]: ExportModeData;
      }
    | ExportModeData;
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
  value: any;
  name: string;
  resolvedType: string;
  resolvedValue?: string;
} | null> {
  const variable = await figma.variables.getVariableByIdAsync(alias.id);
  if (!variable) return null;

  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  if (typeof value === "object" && "id" in value) {
    return resolveVariableAlias(value);
  }

  // For colors, convert to hex
  let resolvedValue = undefined;
  if (variable.resolvedType === "COLOR") {
    resolvedValue = rgbaToHex(value as RGBA);
  }

  return {
    value,
    name: variable.name,
    resolvedType: variable.resolvedType,
    resolvedValue,
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

// Factory for creating variable data while keeping existing types
function createVariableData(
  variable: FormattedVariable,
  modeValue: VariableMode
): ExportVariable {
  const variableData: ExportVariable = {
    $value:
      modeValue.resolvedValue ||
      (typeof modeValue.value === "string"
        ? modeValue.value
        : JSON.stringify(modeValue.value)),
    $type: variable.type,
  };

  if (variable.description) {
    variableData.$description = variable.description;
  }
  if (variable.resolvedName) {
    variableData.$resolvedFrom = variable.resolvedName;
  }

  return variableData;
}

// Utility function to check if variable should be hidden
function isHiddenVariable(
  variable: FormattedVariable,
  collection: FormattedCollection
): boolean {
  return variable.hiddenFromPublishing || collection.name.startsWith("_");
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
        const variableModes: Record<
          string,
          {
            displayValue: string;
            value: VariableAlias | string;
            resolvedValue?: string;
            resolvedName?: string;
            hexColor?: string;
            type: string;
          }
        > = {};

        for (const mode of collection.modes) {
          const value = variable.valuesByMode[mode.modeId];

          if (typeof value === "object" && "id" in value) {
            const resolved = await resolveVariableAlias(value);
            if (resolved) {
              variableModes[mode.name] = {
                value: value || resolved.value,
                displayValue: resolved.name,
                resolvedName: resolved.name,
                resolvedValue: resolved.resolvedValue, // This will contain the hex value for colors
                type: resolved.resolvedType || "",
              };
            }
          } else {
            if (variable.resolvedType === "COLOR") {
              const hex = rgbaToHex(value as RGBA);
              variableModes[mode.name] = {
                value: hex,
                displayValue: hex,
                resolvedValue: hex,
                type: "COLOR",
              };
            } else {
              variableModes[mode.name] = {
                value: value.toString(),
                displayValue: value.toString(),
                type: variable.resolvedType || "",
              };
            }
          }
        }

        const formattedVariable: FormattedVariable = {
          name: variable.name,
          type: variable.resolvedType || "",
          description: variable.description || "",
          modes: variableModes,
          id: variable.id,
          key: variable.key,
          variableCollectionId: variable.variableCollectionId,
          resolvedType: variable.resolvedType,
          valuesByMode: variable.valuesByMode as {
            [key: string]: string | number | boolean | RGBA | VariableAlias;
          },
          remote: variable.remote,
          hiddenFromPublishing: variable.hiddenFromPublishing,
          scopes: variable.scopes,
          codeSyntax: variable.codeSyntax,
        };

        variables.push(formattedVariable);
      } catch (err) {
        console.error(`Error formatting variable ${variable.name}:`, err);
      }
    }

    if (variables.length > 0) {
      formattedCollections.push({
        name: collection.name,
        modes: collection.modes.map((m) => m.name),
        variables: variables,
      });
    }
  }

  const exportData: ExportData = {};
  for (const collection of formattedCollections) {
    const hiddenCollection = collection.name.startsWith("_");

    if (!hiddenCollection) {
      exportData[collection.name] = {};
    }

    if (collection.modes.length > 1) {
      for (const mode of collection.modes) {
        const modeVariables: { [key: string]: ExportVariable } = {};

        for (const variable of collection.variables) {
          const isHidden = isHiddenVariable(variable, collection);
          const modeValue = variable.modes[mode];

          if (modeValue && !isHidden) {
            modeVariables[variable.name] = createVariableData(
              variable,
              modeValue
            );
          }
        }

        if (!hiddenCollection) {
          exportData[collection.name][mode] = modeVariables;
        }
      }
      for (const mode of collection.modes) {
        const modeVariables: { [key: string]: ExportVariable } = {};

        for (const variable of collection.variables) {
          const isHidden = isHiddenVariable(variable, collection);
          const modeValue = variable.modes[mode];

          if (modeValue && !isHidden) {
            modeVariables[variable.name] = createVariableData(
              variable,
              modeValue
            );
          }
        }

        if (!hiddenCollection) {
          exportData[collection.name][mode] = modeVariables;
        }
      }
    } else {
      const collectionVariables: { [key: string]: ExportVariable } = {};

      for (const variable of collection.variables) {
        const isHidden = isHiddenVariable(variable, collection);
        const modeValue = Object.values(variable.modes)[0];

        if (modeValue && !isHidden) {
          collectionVariables[variable.name] = createVariableData(
            variable,
            modeValue
          );
        }
      }

      if (!hiddenCollection) {
        exportData[collection.name] = collectionVariables;
      }
    }
  }

  return {
    collections: formattedCollections,
    exportData: exportData,
  };
}

// Initialize size on startup
initializeSize();

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
      await figma.clientStorage.setAsync("github-settings", null);
      await figma.clientStorage.setAsync("size", null);

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
