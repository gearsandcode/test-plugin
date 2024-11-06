import type { GitHubConfig } from './types';

function getEnvVar(name: string): string {
  const key = `VITE_GITHUB_${name}` as keyof ImportMetaEnv;
  const value = import.meta.env[key];

  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value;
}

export const githubConfig: GitHubConfig = {
  clientId: getEnvVar('CLIENT_ID'),
  redirectUri: 'https://www.figma.com/figma/plugin/callback',
  apiUrl: 'https://api.github.com',
} as const;
