export interface CommitData {
  branch: string;
  message: string;
  filename: string;
  content: string;
}

export type PartialCommitData = Partial<CommitData>;

export interface StoredSettings {
  token: string;
  organization: string;
  repository: string;
  label: string;
  commitData?: PartialCommitData;
}
