import { GithubConfig } from './types';

export const githubConfig: GithubConfig = {
  token: import.meta.env.VITE_GITHUB_TOKEN,
  apiUrl: 'https://api.github.com',
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
  redirectUri: import.meta.env.VITE_GITHUB_REDIRECT_URI,
};
