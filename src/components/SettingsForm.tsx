import React, { useState, FormEvent, ChangeEvent, memo } from "react";
import type { StoredSettings } from "../PluginStore.js";

interface Props {
  initialSettings: StoredSettings | null;
  onSave: (settings: StoredSettings) => void;
}

const FormInput = memo(
  ({
    label,
    name,
    value,
    type = "text",
    onChange,
  }: {
    label: string;
    name: string;
    value: string;
    type?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="space-y-1">
      <label className="text-xs">{label}</label>
      <input
        type={type}
        name={name}
        className="w-full px-2 py-1.5 text-sm border rounded-sm border-black/10 hover:border-black/30 focus:border-blue-500 focus:outline-none transition-colors"
        value={value}
        onChange={onChange}
        required
      />
    </div>
  )
);

FormInput.displayName = "FormInput";

const SettingsForm: React.FC<Props> = ({ initialSettings, onSave }) => {
  const [formData, setFormData] = useState<StoredSettings>({
    token: initialSettings?.token || "",
    organization: initialSettings?.organization || "gearsandcode",
    repository: initialSettings?.repository || "docs",
    label: initialSettings?.label || "figma-plugin",
    commitData: initialSettings?.commitData, // Preserve commitData
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Preserve the existing commitData when saving
    const settingsToSave = {
      ...formData,
      commitData: initialSettings?.commitData || formData.commitData,
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: settingsToSave,
        },
      },
      "*"
    );

    onSave(settingsToSave);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-base font-medium">GitHub Settings</h1>
        <p className="text-xs text-black/50 mt-1">
          Configure your GitHub repository settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormInput
          label="PERSONAL ACCESS TOKEN"
          name="token"
          type="password"
          value={formData.token}
          onChange={handleChange}
        />
        <FormInput
          label="ORGANIZATION/USER"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
        />
        <FormInput
          label="REPOSITORY"
          name="repository"
          value={formData.repository}
          onChange={handleChange}
        />
        <FormInput
          label="DEFAULT LABEL"
          name="label"
          value={formData.label}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-1.5 px-3 mt-4
            rounded-sm text-white text-xs
            transition-colors
            ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            }
          `}
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
};

export default SettingsForm;
