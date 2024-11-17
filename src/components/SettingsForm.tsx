import { useState } from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Input, Button, Alert } from "./";
import type { StoredSettings } from "../types";

type SettingsFormProps = {
  initialSettings: StoredSettings | null;
  onSave: (settings: StoredSettings) => void;
};

const DEFAULT_VALUES = {
  organization: "gearsandcode",
  repository: "docs",
  label: "figma-plugin",
};

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
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
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

  function handleUseDefaults() {
    setFormData((prev) => ({
      ...prev,
      organization: DEFAULT_VALUES.organization,
      repository: DEFAULT_VALUES.repository,
      label: DEFAULT_VALUES.label,
    }));
  }

  function handleClear() {
    if (window.confirm("Are you sure you want to clear all settings?")) {
      const emptySettings: StoredSettings = {
        token: "",
        organization: "",
        repository: "",
        label: "",
      };
      setFormData(emptySettings);
      onSave(emptySettings);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-medium">GitHub Settings</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your GitHub repository settings
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} onDismiss={() => setError("")} />
      )}

      <Input
        label="PERSONAL ACCESS TOKEN"
        type="password"
        value={formData.token}
        onChange={(e) => handleChange("token", e.target.value)}
        required
      />

      <div className="space-y-4">
        <Input
          label="ORGANIZATION/USER"
          value={formData.organization}
          onChange={(e) => handleChange("organization", e.target.value)}
          required
        />

        <Input
          label="REPOSITORY"
          value={formData.repository}
          onChange={(e) => handleChange("repository", e.target.value)}
          required
        />

        <Input
          label="DEFAULT LABEL"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          required
        />

        <button
          type="button"
          onClick={handleUseDefaults}
          className="
            inline-flex items-center gap-2
            text-xs text-gray-500 hover:text-gray-900
            dark:text-gray-400 dark:hover:text-gray-100
            transition-colors
          "
        >
          <ArrowClockwise className="w-3 h-3" />
          Use default values
        </button>
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

        <Button
          type="button"
          variant="danger"
          onClick={handleClear}
          className="text-xs"
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
