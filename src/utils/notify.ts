/**
 * Send notification through plugin message system
 */
export const notify = (message: string, error = false) => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "notify",
        message,
        error,
      },
    },
    "*"
  );
};
