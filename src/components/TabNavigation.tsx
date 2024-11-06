import React from 'react';

interface TabNavigationProps {
  activeTab: 'info' | 'commit';
  onTabChange: (tab: 'info' | 'commit') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('info')}
          className={`${
            activeTab === 'info'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
        >
          Repository Info
        </button>
        <button
          onClick={() => onTabChange('commit')}
          className={`${
            activeTab === 'commit'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
        >
          Create Commit
        </button>
      </nav>
    </div>
  );
}
