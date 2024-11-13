import React, { useState, FormEvent, ChangeEvent, memo } from "react";

interface Settings {
  token: string;
  organization: string;
  repository: string;
  label: string;
}

interface Props {
  initialSettings: Settings | null;
  onSave: (settings: Settings) => void;
}

const DEFAULT_VALUES = {
  organization: "gearsandcode",
  repository: "docs",
  label: "figma-plugin",
};

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
        className="w-full px-2 py-1.5 border rounded-sm text-sm
          hover:border-black/30 focus:border-blue-500 focus:outline-none transition-colors"
        value={value}
        onChange={onChange}
        required
      />
    </div>
  )
);

FormInput.displayName = "FormInput";

const SettingsForm: React.FC<Props> = ({ initialSettings, onSave }) => {
  const [formData, setFormData] = useState<Settings>({
    token: initialSettings?.token || "",
    organization: initialSettings?.organization || DEFAULT_VALUES.organization,
    repository: initialSettings?.repository || DEFAULT_VALUES.repository,
    label: initialSettings?.label || DEFAULT_VALUES.label,
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

    parent.postMessage(
      {
        pluginMessage: {
          type: "save-settings",
          settings: formData,
        },
      },
      "*"
    );

    onSave(formData);
    setLoading(false);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all settings?")) {
      const emptySettings = {
        token: "",
        organization: "",
        repository: "",
        label: "",
      };

      setFormData(emptySettings);

      parent.postMessage(
        {
          pluginMessage: {
            type: "save-settings",
            settings: emptySettings,
          },
        },
        "*"
      );

      onSave(emptySettings);
    }
  };

  const handleUseDefaults = () => {
    const defaultSettings = {
      ...formData,
      organization: DEFAULT_VALUES.organization,
      repository: DEFAULT_VALUES.repository,
      label: DEFAULT_VALUES.label,
    };
    setFormData(defaultSettings);
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-base font-medium">GitHub Settings</h1>
        <p className="text-xs opacity-50 mt-1">
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
        <div className="space-y-4">
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
            type="button"
            onClick={handleUseDefaults}
            className="
              text-sm
              text-blue-500 hover:text-blue-600
              flex items-center
              transition-colors
            "
          >
            Use default values
          </button>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`
            flex-1 py-1.5 px-3
            rounded-sm text-sm text-white
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

          <button
            type="button"
            onClick={handleClear}
            className="
            py-1.5 px-3
            rounded-sm text-sm
            text-red-500 hover:text-red-600 active:text-red-700
            border border-red-500 hover:border-red-600 active:border-red-700
            transition-colors
          "
          >
            Clear Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;
