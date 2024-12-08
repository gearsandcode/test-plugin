/**
 * Represents the data required to make a commit to a GitHub repository.
 * @interface
 * @property {string} branch - The name of the branch where the commit will be made
 * @property {string} baseBranch - The name of the base branch to create the new branch from
 * @property {string} message - The commit message
 * @property {string} filename - The name of the file being committed
 * @property {string} content - The content to be committed to the file
 */
interface CommitData {
  branch: string;
  baseBranch: string;
  message: string;
  filename: string;
  content: string;
}

/**
 * Represents a partial type of CommitData, making all properties optional.
 * @typedef {Partial<CommitData>} PartialCommitData
 */
export type PartialCommitData = Partial<CommitData>;

/**
 * Represents an existing pull request on GitHub.
 * @interface
 */
export interface ExistingPR {
  /**
   * The head branch of the pull request.
   * @type {string}
   */
  head: string;
  /**
   * The number of the pull request.
   * @type {number}
   */
  number: number;
  /**
   * The title of the pull request.
   * @type {string}
   */
  title: string;
  /**
   * The URL of the pull request on GitHub.
   * @type {string}
   */
  html_url: string;
}

/**
 * Represents the stored settings for the application.
 * @interface
 */
export interface StoredSettings {
  /**
   * The GitHub token for authentication.
   * @type {string}
   */
  token: string;
  /**
   * The organization name on GitHub.
   * @type {string}
   */
  organization: string;
  /**
   * The repository name on GitHub.
   * @type {string}
   */
  repository: string;
  /**
   * The label for the settings.
   * @type {string}
   */
  label: string;
  /**
   * The branch name.
   * @type {string}
   * @optional
   */
  branch?: string;
  /**
   * The base branch name.
   * @type {string}
   * @optional
   */
  baseBranch?: string;
  /**
   * The commit data.
   * @type {Partial<CommitData>}
   * @optional
   */
  commitData?: Partial<CommitData>;
}

/**
 * Represents the mode of the pull request form.
 * @type {"initial" | "update" | "create"}
 */
type PRFormMode = "initial" | "update" | "create";

/**
 * Represents the mode for creating or updating.
 * @type {Exclude<PRFormMode, "initial">}
 */
export type CreateUpdateMode = Exclude<PRFormMode, "initial">;

/**
 * Represents the mode for branch selection.
 * @type {"existing" | "new"}
 */
export type BranchSelectionMode = "existing" | "new";

/**
 * Represents the value of a variable in different modes.
 * @interface
 */
interface VariableValue {
  /**
   * The value of the variable.
   * @type {string}
   */
  value: string;
  /**
   * The display value of the variable.
   * @type {string}
   */
  displayValue: string;
  /**
   * The resolved name of the variable.
   * @type {string}
   * @optional
   */
  resolvedName?: string;
  /**
   * The resolved value of the variable.
   * @type {string}
   * @optional
   */
  resolvedValue?: string;
  /**
   * The hex color value of the variable.
   * @type {string}
   * @optional
   */
  hexColor?: string;
  /**
   * The type of the variable.
   * @type {string}
   */
  type: string;
}

/**
 * Represents a variable with its modes and metadata.
 * @interface
 */
export interface Variable {
  /**
   * Indicates if the variable is hidden from publishing.
   * @type {boolean}
   */
  hiddenFromPublishing: boolean;
  /**
   * The name of the variable.
   * @type {string}
   */
  name: string;
  /**
   * The type of the variable.
   * @type {string}
   */
  type: string;
  /**
   * The description of the variable.
   * @type {string}
   * @optional
   */
  description?: string;
  /**
   * The modes of the variable.
   * @type {Record<string, VariableValue>}
   */
  modes: Record<string, VariableValue>;
}

/**
 * Represents a collection of variables.
 * @interface
 */
export interface VariableCollection {
  /**
   * The name of the collection.
   * @type {string}
   */
  name: string;
  /**
   * The modes available in the collection.
   * @type {string[]}
   */
  modes: string[];
  /**
   * The variables in the collection.
   * @type {Variable[]}
   */
  variables: Variable[];
}

/**
 * Represents a formatted collection of variables.
 * @type {VariableCollection}
 */
export type FormattedCollection = VariableCollection;

/**
 * Represents the value of a mode in different contexts.
 * @interface
 */
export interface ModeValue {
  /**
   * The display value of the mode.
   * @type {string}
   * @optional
   */
  displayValue?: string;
  /**
   * The value of the mode.
   * @type {string}
   */
  value: string;
  /**
   * The resolved value of the mode.
   * @type {string}
   * @optional
   */
  resolvedValue?: string;
  /**
   * The resolved name of the mode.
   * @type {string}
   * @optional
   */
  resolvedName?: string;
  /**
   * The hex color value of the mode.
   * @type {string}
   * @optional
   */
  hexColor?: string;
  /**
   * The type of the mode.
   * @type {string}
   */
  type: string;
}

/**
 * Represents a nested group of variables.
 * @interface
 */
export interface NestedGroup {
  /**
   * The name of the group.
   * @type {string}
   */
  name: string;
  /**
   * The full path of the group.
   * @type {string}
   */
  fullPath: string;
  /**
   * The variables in the group.
   * @type {Variable[]}
   */
  variables: Variable[];
  /**
   * The child groups.
   * @type {Map<string, NestedGroup>}
   */
  children: Map<string, NestedGroup>;
  /**
   * Indicates if the group is open.
   * @type {boolean}
   * @optional
   */
  isOpen?: boolean;
}
