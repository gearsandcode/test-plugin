import { fetchRepoInfo } from './api';

figma.showUI(__html__, {
  width: 450,
  height: 600,
  themeColors: true
});

figma.ui.onmessage = function(msg) {
  if (msg.type === 'fetch-repo') {
    fetchRepoInfo(msg.org, msg.repo, msg.branch || 'main')
      .then(function(data) {
        figma.ui.postMessage({ 
          type: 'repo-info', 
          data: data 
        });
      })
      .catch(function(error) {
        figma.ui.postMessage({ 
          type: 'error',
          message: error.message || 'Failed to fetch repository information'
        });
      });
  }
};