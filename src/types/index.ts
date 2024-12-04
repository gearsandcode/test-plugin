// types/index.ts
export interface CommitData {
  branch: string;
  baseBranch: string;
  message: string;
  filename: string;
  content: string;
}

export type PartialCommitData = Partial<CommitData>;

export interface PRFormData {
  title: string;
  commitMessage: string;
  updateBranch: string;
  baseBranch: string;
  description: string;
}

export interface ExistingPR {
  head: string;
  number: number;
  title: string;
  html_url: string;
}

export interface PRResult {
  success: boolean;
  prNumber: number;
  prUrl: string;
  existingPR?: ExistingPR;
}

export interface StoredSettings {
  token: string;
  organization: string;
  repository: string;
  label: string;
  branch?: string;
  baseBranch?: string;
  commitData?: Partial<CommitData>;
}

export interface PullRequestFormProps {
  settings: StoredSettings;
  onCancel: () => void;
  onSubmit: (data: PRFormData, existingPR?: ExistingPR) => Promise<void>;
  loading?: boolean;
}

export type PRFormMode = "initial" | "update" | "create";
export type CreateUpdateMode = Exclude<PRFormMode, "initial">;
export type BranchSelectionMode = "existing" | "new";
export interface BranchSelectorProps {
  id?: string;
  label: string;
  mode?: BranchSelectionMode;
  branches: string[];
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  onModeChange?: (mode: BranchSelectionMode) => void;
  allowNew?: boolean;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}

export interface ViewProps {
  formData: PRFormData;
  mode: PRFormMode;
  existingPR: ExistingPR;
  errors: Partial<Record<keyof PRFormData, string>>;
  branches: string[];
  branchesLoading: boolean;
  updateBranchMode: BranchSelectionMode;
  onCancel: () => void;
  onBranchChange: (type: "base" | "update", value: string) => Promise<void>;
  onModeSelect: (mode: Exclude<PRFormMode, "initial">) => void;
  onUpdateBranchModeChange: (mode: BranchSelectionMode) => void;
  onFormChange: (field: keyof PRFormData, value: string) => void;
}

export interface CreateUpdateViewProps {
  mode: CreateUpdateMode;
  formData: PRFormData;
  errors: Partial<Record<keyof PRFormData, string>>;
  branches: string[];
  branchesLoading: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBranchChange: (type: "base" | "update", value: string) => Promise<void>;
  onFormChange: (field: keyof PRFormData, value: string) => void;
  loading: boolean;
}
