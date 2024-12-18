type DesignToken = {
  [key: string]: any;
};

const TOKEN_PROPERTIES = ["value", "description", "type"];

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray
  | DesignToken;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface ValueChange {
  path: string[];
  oldValue: JsonValue;
  newValue: JsonValue;
}

type Change = ValueChange;

function isDesignToken(value: any): value is DesignToken {
  return (
    value &&
    typeof value === "object" &&
    ("$value" in value || "$type" in value)
  );
}

function flattenTokens(
  obj: JsonValue,
  parentPath: string[] = []
): Map<string, JsonValue> {
  const result = new Map<string, JsonValue>();

  function traverse(current: JsonValue, path: string[]) {
    if (!current || typeof current !== "object") {
      return;
    }

    // Check if current object is a design token by looking for any of our tracked properties
    if (
      typeof current === "object" &&
      TOKEN_PROPERTIES.some((prop) => `$${prop}` in current)
    ) {
      // Store all tracked properties for this token
      TOKEN_PROPERTIES.forEach((prop) => {
        const value = (current as any)[`$${prop}`];
        if (value !== undefined) {
          // Store without $ prefix in path
          result.set([...path, prop].join("/"), value);
        }
      });
      return;
    }

    // Continue traversing object
    Object.entries(current as object).forEach(([key, value]) => {
      traverse(value, [...path, key]);
    });
  }

  traverse(obj, parentPath);
  return result;
}

export function findJsonDiff(oldJson: string, newJson: string): ValueChange[] {
  try {
    const oldObj = JSON.parse(oldJson);
    const newObj = JSON.parse(newJson);

    const oldTokens = flattenTokens(oldObj);
    const newTokens = flattenTokens(newObj);
    const changes: ValueChange[] = [];

    // Compare all paths
    const allPaths = new Set([...oldTokens.keys(), ...newTokens.keys()]);

    for (const path of allPaths) {
      const oldValue = oldTokens.get(path);
      const newValue = newTokens.get(path);

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          path: path.split("/"),
          oldValue: oldValue !== undefined ? oldValue : null,
          newValue: newValue !== undefined ? newValue : null,
        });
      }
    }

    return changes;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
}

function isHexColor(value: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}

function formatValue(action: string, prop: string, value: any): string {
  if (typeof value !== "string") {
    return JSON.stringify(value);
  }

  // Remove $ prefix from property names in the value if they exist
  const cleanValue = value.replace(/"\$(\w+)":/g, '"$1":');

  if (prop === "value" && isHexColor(value)) {
    return `<span style="display: flex; align-items: center; gap: 4px; height: 26px;"><span>${action} ${prop}:</span><span style="background-color: ${value}; display: inline-block; width: 16px; height: 16px;"></span><span>${action} ${value}</span></span>`;
  }

  return cleanValue;
}

export function formatJsonDiff(changes: ValueChange[]): string {
  if (changes.length === 0) return "";

  return changes
    .sort((a, b) => a.path.join("/").localeCompare(b.path.join("/")))
    .map((change) => {
      // Get the last segment without any $ prefix
      const pathSegments = change.path.map((segment) =>
        segment.replace(/^\$/, "")
      );
      const path = pathSegments.join("/");
      const propertyName = pathSegments[pathSegments.length - 1];

      const lines = [`@ ${path}`];

      if (change.oldValue !== undefined) {
        lines.push(`${formatValue("-", propertyName, change.oldValue)}`);
      }
      if (change.newValue !== undefined) {
        lines.push(`${formatValue("+", propertyName, change.newValue)}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}
