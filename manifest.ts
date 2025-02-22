export default {
  name: "Github Variables Sync",
  id: "1436856323072408954",
  api: "1.0.0",
  main: "./code.js",
  ui: "./index.html",
  editorType: ["figma"],
  documentAccess: "dynamic-page",
  enablePrivatePluginApi: true,
  networkAccess: {
    allowedDomains: ["https://api.github.com"],
  },
};
