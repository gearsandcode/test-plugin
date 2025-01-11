// src/components/ViewLocalChanges.tsx
import { useState } from "react";
import { ClipboardText } from "@phosphor-icons/react";
import type { Styles } from "../types";

interface Variable {
  name: string;
  type: string;
  resolvedValue?: any;
  value?: any;
  description?: string;
}

interface ViewLocalChangesProps {
  variables: any[];
  styles: Styles;
}

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a !== 1 ? `${hex}${toHex(a)}` : hex;
}

function formatAsDesignTokens(variables: any[], styles: Styles) {
  const tokens: {
    $schema: string;
    colors: Record<string, any>;
    typography: Record<string, any>;
    effects: Record<string, any>;
    [key: string]: any;
  } = {
    $schema: "https://design-tokens.github.io/format/v0.1/token-schema.json",
    colors: {},
    typography: {},
    effects: {},
  };

  // Format variables as design tokens
  variables.forEach((collection) => {
    collection.variables.forEach((variable: Variable) => {
      const tokenPath = variable.name.split("/");
      let current = tokens;

      tokenPath.forEach((segment, index) => {
        if (index === tokenPath.length - 1) {
          const value = variable.resolvedValue || variable.value;
          // Convert RGBA to hex if needed
          const processedValue =
            variable.type === "COLOR" && value?.r !== undefined
              ? rgbaToHex(value.r, value.g, value.b, value.a)
              : value;

          current[segment] = {
            $value:
              processedValue ||
              console.error("No value provided for variable", variable),
            $type: variable.type.toLowerCase(),
            ...(variable.description && { $description: variable.description }),
          };
        } else {
          current[segment] = current[segment] || {};
          current = current[segment];
        }
      });
    });
  });

  // Format styles as design tokens
  Object.entries(styles).forEach(([type, stylesList]) => {
    stylesList.forEach(
      (style: {
        paints: any[];
        name: string | number;
        description: any;
        fontName: { family: any };
        fontSize: any;
        lineHeight: { value: any };
        letterSpacing: { value: any };
        paragraphSpacing: any;
        textCase: any;
        textDecoration: any;
        effects: {
          type: any;
          color: { r: number; g: number; b: number; a: any };
          offset: any;
          radius: any;
          spread: any;
        }[];
      }) => {
        switch (type) {
          case "paint":
            if (style.paints?.[0]) {
              const paint = style.paints[0];
              let value;

              if (paint.type === "SOLID" && paint.color) {
                value = rgbaToHex(
                  paint.color.r,
                  paint.color.g,
                  paint.color.b,
                  paint.opacity || 1
                );
              }

              tokens.colors[style.name] = {
                $value: value,
                $type: "color",
                ...(style.description && { $description: style.description }),
              };
            }
            break;

          case "text":
            tokens.typography[style.name] = {
              $value: {
                fontFamily: style.fontName?.family || "System",
                fontSize: style.fontSize || 16,
                lineHeight: style.lineHeight?.value || "normal",
                letterSpacing: style.letterSpacing?.value || 0,
                paragraphSpacing: style.paragraphSpacing || 0,
                textCase: style.textCase || "none",
                textDecoration: style.textDecoration || "none",
              },
              $type: "typography",
              ...(style.description && { $description: style.description }),
            };
            break;

          case "effect":
            tokens.effects[style.name] = {
              $value:
                style.effects?.map(
                  (effect: {
                    type: any;
                    color: { r: number; g: number; b: number; a: any };
                    offset: any;
                    radius: any;
                    spread: any;
                  }) => ({
                    type: effect.type,
                    color: effect.color
                      ? rgbaToHex(
                          effect.color.r,
                          effect.color.g,
                          effect.color.b,
                          effect.color.a || 1
                        )
                      : console.error("No color provided for effect"),
                    offset: effect.offset || { x: 0, y: 0 },
                    radius: effect.radius || 0,
                    spread: effect.spread || 0,
                  })
                ) || [],
              $type: "shadow",
              ...(style.description && { $description: style.description }),
            };
            break;
        }
      }
    );
  });

  return tokens;
}

// function StylesTable({ styles }: { styles: Styles }) {
//   return (
//     <table className="w-full border-separate border-spacing-0">
//       <thead>
//         <tr>
//           <th className="sticky top-0 left-0 z-50 p-3 text-xs font-normal border border-figma-border w-[50px] bg-figma-bg text-left">
//             Type
//           </th>
//           <th className="sticky top-0 z-40 p-3 text-xs font-normal border border-figma-border bg-figma-bg text-left">
//             Name
//           </th>
//           <th className="sticky top-0 z-40 p-3 text-xs font-normal border border-figma-border bg-figma-bg text-left">
//             Properties
//           </th>
//         </tr>
//       </thead>
//       <tbody>
//         {Object.entries(styles).map(([type, stylesList]) =>
//           stylesList.map((style) => (
//             <tr key={style.id} className="hover:bg-figma-border/20">
//               <td className="p-3 text-xs border border-figma-border">
//                 {type === 'paint' && <Palette size={14} />}
//                 {type === 'text' && <TextT size={14} />}
//                 {type === 'effect' && <Star size={14} />}
//               </td>
//               <td className="p-3 text-xs border border-figma-border">
//                 {style.name}
//               </td>
//               <td className="p-3 text-xs border border-figma-border font-mono">
//                 <div className="space-y-1">
//                   {style.description && (
//                     <div>Description: {style.description}</div>
//                   )}
//                   {type === 'paint' && style.paints && (
//                     <div className="flex items-center gap-2">
//                       Colors:
//                       {style.paints.map((paint, i) => (
//                         <div
//                           key={i}
//                           className="w-4 h-4 rounded-sm border border-figma-border"
//                           style={{
//                             backgroundColor: paint.type === "SOLID"
//                               ? `rgba(${paint.color.r * 255}, ${paint.color.g * 255}, ${paint.color.b * 255}, ${paint.opacity || 1})`
//                               : undefined
//                           }}
//                         />
//                       ))}
//                     </div>
//                   )}
//                   {type === 'text' && (
//                     <>
//                       {style.fontSize && <div>Font Size: {style.fontSize}</div>}
//                       {style.fontName && <div>Font: {style.fontName.family}</div>}
//                       {style.letterSpacing && <div>Letter Spacing: {style.letterSpacing.value}</div>}
//                       {style.lineHeight && <div>Line Height: {style.lineHeight.value}</div>}
//                     </>
//                   )}
//                   {type === 'effect' && style.effects && (
//                     <div>Effects: {style.effects.length}</div>
//                   )}
//                 </div>
//               </td>
//             </tr>
//           ))
//         )}
//       </tbody>
//     </table>
//   );
// }

export function ViewLocalChanges({ variables, styles }: ViewLocalChangesProps) {
  const [activeView, setActiveView] = useState<
    "variables" | "styles" | "tokens"
  >("variables");

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-4 border-b border-figma-border">
        <button
          onClick={() => setActiveView("variables")}
          className={`px-3 py-1 text-xs rounded-sm transition-colors ${
            activeView === "variables"
              ? "bg-figma-bg-active"
              : "hover:bg-figma-bg-hover"
          }`}
        >
          Variables
        </button>
        <button
          onClick={() => setActiveView("styles")}
          className={`px-3 py-1 text-xs rounded-sm transition-colors ${
            activeView === "styles"
              ? "bg-figma-bg-active"
              : "hover:bg-figma-bg-hover"
          }`}
        >
          Styles
        </button>
        <button
          onClick={() => setActiveView("tokens")}
          className={`px-3 py-1 text-xs rounded-sm transition-colors ${
            activeView === "tokens"
              ? "bg-figma-bg-active"
              : "hover:bg-figma-bg-hover"
          }`}
        >
          Design Tokens
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="flex justify-end mb-2">
          <button
            onClick={() =>
              copyToClipboard(
                JSON.stringify(
                  activeView === "tokens"
                    ? formatAsDesignTokens(variables, styles)
                    : activeView === "variables"
                    ? variables
                    : styles,
                  null,
                  2
                )
              )
            }
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-sm hover:bg-figma-bg-hover"
            title="Copy to clipboard"
          >
            <ClipboardText size={14} />
            Copy to clipboard
          </button>
        </div>

        <pre className="p-4 text-xs bg-figma-bg-secondary rounded-sm overflow-auto">
          <code>
            {JSON.stringify(
              activeView === "tokens"
                ? formatAsDesignTokens(variables, styles)
                : activeView === "variables"
                ? variables
                : styles,
              null,
              2
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
