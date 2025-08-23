
import React from 'react';
import { GitPullRequest } from 'lucide-react';
import PRReviewAgent from './components/PRReviewAgent';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-black/30">
        <div className="px-4 py-3 flex items-center gap-2 w-full justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-sky-400" />
            <div className="text-sm text-gray-800 dark:text-slate-400">PR Review Agent • LangGraph (Demo)</div>
          </div>
          <ThemeToggle />
        </div>
      </div>
      <div className="p-4 w-full">
        <PRReviewAgent />
      </div>
    </div>
  );
}
