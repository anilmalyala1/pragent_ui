
import React from 'react';
import { GitPullRequest } from 'lucide-react';
import PRReviewAgent from './components/PRReviewAgent';

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-[1300px] px-4 py-3 flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-sky-400" />
          <div className="text-sm text-slate-400">PR Review Agent • LangGraph (Demo)</div>
        </div>
      </div>
      <div className="mx-auto max-w-[1300px] p-4">
        <PRReviewAgent />
      </div>
    </div>
  );
}
