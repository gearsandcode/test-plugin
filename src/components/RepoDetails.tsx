import React from "react";
import type { RepoInfo, BranchInfo } from "../types";

interface RepoDetailsProps {
  repo: RepoInfo;
  branch: BranchInfo;
}

const RepoDetails: React.FC<RepoDetailsProps> = ({ repo, branch }) => {
  return (
    <div className="mt-6 bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Repository Information
      </h3>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium text-gray-500">Full Name</span>
          <span className="text-sm text-gray-900">{repo.full_name}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium text-gray-500">Description</span>
          <span className="text-sm text-gray-900">
            {repo.description || "N/A"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium text-gray-500">
            Primary Language
          </span>
          <span className="text-sm text-gray-900">
            {repo.language || "N/A"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium text-gray-500">
            Default Branch
          </span>
          <span className="text-sm text-gray-900">{repo.default_branch}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium text-gray-500">
            Current Branch
          </span>
          <span className="text-sm text-gray-900">
            {branch.name}
            {branch.protected && " (Protected)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium text-gray-500">
            Latest Commit
          </span>
          <span className="text-sm text-gray-900 font-mono">
            {branch.commit.sha.substring(0, 7)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {repo.stargazers_count.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Stars</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {repo.forks_count.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Forks</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {repo.open_issues_count.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepoDetails;
