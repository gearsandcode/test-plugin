import React, { useState } from "react";
import { Input, Button, Alert } from "./";
import type { StoredSettings } from "../types";

interface SettingsFormProps {
  initialSettings: StoredSettings | null;
  onSave: (settings: Partial<StoredSettings>) => Promise<void>;
}

const DEFAULT_VALUES = {
  organization: "gearsandcode",
  repository: "docs",
  label: "figma-plugin",
};

/**
 * Settings form component with complete data clearing functionality
 */
export function SettingsForm({ initialSettings, onSave }: SettingsFormProps) {
  const [formData, setFormData] = useState<StoredSettings>({
    token: initialSettings?.token || "",
    organization: initialSettings?.organization || DEFAULT_VALUES.organization,
    repository: initialSettings?.repository || DEFAULT_VALUES.repository,
    label: initialSettings?.label || DEFAULT_VALUES.label,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  function handleChange(key: keyof StoredSettings, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function handleResetViewState() {
    if (window.confirm("Are you sure you want to reset all view states?")) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "reset-view-state",
          },
        },
        "*"
      );

      parent.postMessage(
        {
          pluginMessage: {
            type: "notify",
            message: "View states reset successfully",
          },
        },
        "*"
      );
    }
  }

  function handleClearAllData() {
    if (
      window.confirm(
        "Are you sure you want to clear all settings and stored data? This action cannot be undone."
      )
    ) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "clear-all-data",
          },
        },
        "*"
      );

      // Reset form
      setFormData({
        token: "",
        organization: "",
        repository: "",
        label: "",
      });

      // Notify user
      parent.postMessage(
        {
          pluginMessage: {
            type: "notify",
            message: "All settings and stored data cleared",
          },
        },
        "*"
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-medium">GitHub Settings</h2>
        </div>
        <p className="text-sm opacity-50">
          Configure your GitHub repository settings
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} onDismiss={() => setError("")} />
      )}

      <Input
        label="Personal access token"
        type="password"
        value={formData.token}
        onChange={(e) => handleChange("token", e.target.value)}
        required
      />

      <div className="space-y-4">
        <Input
          label="Organization/User"
          value={formData.organization}
          onChange={(e) => handleChange("organization", e.target.value)}
          required
        />

        <Input
          label="Repository"
          value={formData.repository}
          onChange={(e) => handleChange("repository", e.target.value)}
          required
        />

        <Input
          label="Default label"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          required
        />
      </div>

      <div className="border-t border-black/10 dark:border-white/10 pt-4 mt-4 space-y-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleResetViewState}
          className="w-full justify-center"
        >
          Reset View States
        </Button>

        <Button
          type="button"
          variant="danger"
          onClick={handleClearAllData}
          className="w-full justify-center"
        >
          Clear All Settings and Data
        </Button>
      </div>

      <div className="flex space-x-2 pt-2">
        <Button
          type="submit"
          loading={loading}
          variant="primary"
          className="flex-1"
        >
          Save Settings
        </Button>
      </div>
    </form>
  );
}
