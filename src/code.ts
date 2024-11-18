import { saveSettings, loadSettings } from "./PluginStore";

type FormattedValue = {
  value: VariableValue | null;
  referencedVariable?: string;
};

interface FormattedVariableData {
  name: string;
  value: string;
  description?: string;
  type: VariableResolvedDataType;
}

interface FormattedCollection {
  collection: string;
  variables: FormattedVariableData[];
}

interface ExportedVariable {
  value: VariableValue | null;
  type: VariableResolvedDataType;
  description?: string;
  scope: string;
  referencedVariable?: string;
}

interface ExportedCollection {
  [key: string]: ExportedVariable;
}

interface ExportData {
  [key: string]: ExportedCollection;
}

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

// Convert RGB(A) to hex string
function rgbToHex(color: RGB | RGBA): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  const hex = "#" + toHex(color.r) + toHex(color.g) + toHex(color.b);
  return "a" in color ? hex + toHex(color.a) : hex;
}

// Resolve variable alias to actual value
function resolveVariableAlias(alias: VariableAlias): string {
  const referencedVariable = figma.variables.getVariableById(alias.id);
  if (!referencedVariable) return "Unknown reference";

  const modes = Object.keys(referencedVariable.valuesByMode);
  const modeId = modes[0];
  const value = referencedVariable.valuesByMode[modeId];

  return getDisplayValue(value, referencedVariable.resolvedType);
}

// Get display value for UI
function getDisplayValue(
  value: VariableValue,
  type: VariableResolvedDataType
): string {
  if (value === null || value === undefined) return "null";

  if (typeof value === "object" && "id" in value) {
    return "Reference: " + value.id; // We'll resolve references separately
  }

  switch (type) {
    case "COLOR": {
      const color = value as RGB | RGBA;
      return rgbToHex(color);
    }
    case "FLOAT":
    case "STRING":
      return String(value);
    case "BOOLEAN":
      return value ? "true" : "false";
    default:
      return JSON.stringify(value);
  }
}

// Format variable value for export
async function formatVariableValue(
  value: VariableValue | null,
  type: VariableResolvedDataType
): Promise<FormattedValue> {
  if (value === null || value === undefined) {
    return { value: null };
  }

  if (typeof value === "object" && "id" in value) {
    const referencedVariable = await figma.variables.getVariableByIdAsync(
      value.id
    );
    return {
      value: value,
      referencedVariable: referencedVariable
        ? referencedVariable.name
        : undefined,
    };
  }

  return { value: value };
}

// Format single variable for response
function formatVariable(variable: Variable): FormattedVariableData | null {
  if (!variable || variable.remote) return null;

  const modes = Object.keys(variable.valuesByMode);
  const modeId = modes[0];
  const value = variable.valuesByMode[modeId];

  return {
    name: variable.name,
    value: getDisplayValue(value, variable.resolvedType),
    description: variable.description || undefined,
    type: variable.resolvedType,
  };
}

// Format variables for export
async function formatVariablesForExport(
  collections: readonly VariableCollection[]
): Promise<ExportData> {
  const result: ExportData = {};

  for (const collection of collections) {
    const variables: ExportedCollection = {};

    for (const id of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (!variable || variable.remote) continue;

      const modes = Object.keys(variable.valuesByMode);
      const modeId = modes[0];
      const formatted = await formatVariableValue(
        variable.valuesByMode[modeId],
        variable.resolvedType
      );

      variables[variable.name] = {
        value: formatted.value,
        type: variable.resolvedType,
        description: variable.description || undefined,
        scope: variable.scopes.join(", "),
        referencedVariable: formatted.referencedVariable,
      };
    }

    if (Object.keys(variables).length > 0) {
      result[collection.name] = variables;
    }
  }

  return result;
}

async function getVariablesData(): Promise<{
  variables: FormattedCollection[];
  exportData: ExportData;
}> {
  try {
    console.log("Starting to fetch collections...");
    const collections =
      await figma.variables.getLocalVariableCollectionsAsync();
    console.log("Collections fetched:", collections.length);

    const variables: FormattedCollection[] = [];
    const exportData: ExportData = {};

    for (const collection of collections) {
      console.log("Processing collection:", collection.name);
      const formattedVariables: FormattedVariableData[] = [];
      const exportedVariables: ExportedCollection = {};

      for (const id of collection.variableIds) {
        try {
          console.log("Fetching variable:", id);
          const variable = await figma.variables.getVariableByIdAsync(id);

          if (!variable) {
            console.log("Variable not found:", id);
            continue;
          }

          if (variable.remote) {
            console.log("Skipping remote variable:", variable.name);
            continue;
          }

          console.log(
            "Processing variable:",
            variable.name,
            variable.resolvedType
          );
          const modes = Object.keys(variable.valuesByMode);

          if (modes.length === 0) {
            console.log("No modes found for variable:", variable.name);
            continue;
          }

          const modeId = modes[0];
          const value = variable.valuesByMode[modeId];

          // Format for UI display
          formattedVariables.push({
            name: variable.name,
            value:
              typeof value === "object" ? JSON.stringify(value) : String(value),
            description: variable.description || undefined,
            type: variable.resolvedType,
          });

          // Format for export
          exportedVariables[variable.name] = {
            value: value,
            type: variable.resolvedType,
            description: variable.description || undefined,
            scope: variable.scopes.join(", "),
            referencedVariable: undefined,
          };
        } catch (err) {
          console.error("Error processing variable:", id, err);
        }
      }

      if (formattedVariables.length > 0) {
        variables.push({
          collection: collection.name,
          variables: formattedVariables,
        });
        exportData[collection.name] = exportedVariables;
      }
    }

    console.log("Processing complete");
    console.log("Collections processed:", variables.length);

    return { variables, exportData };
  } catch (error) {
    console.error("Error in getVariablesData:", error);
    throw error;
  }
}

figma.ui.onmessage = async (msg) => {
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
      console.log("Starting variables request...");
      const data = await getVariablesData();
      console.log("Variables data retrieved successfully");

      figma.ui.postMessage({
        type: "variables-loaded",
        variables: data.variables,
        exportData: data.exportData,
      });
    } catch (error) {
      console.error("Error loading variables:", error);
      figma.notify(
        "Error loading variables: " +
          (error instanceof Error ? error.message : String(error)),
        { error: true }
      );
    }
  } else if (msg.type === "create-pr") {
    try {
      const data = await getVariablesData();
      const prData = Object.assign({}, msg.data, {
        variablesJson: JSON.stringify(data.exportData, null, 2),
      });

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
