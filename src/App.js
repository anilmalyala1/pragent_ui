
import React from 'react';
import { GitPullRequest, Moon, Sun } from 'lucide-react';
import PRReviewAgent from './components/PRReviewAgent';

export default function App() {
  const [darkMode, setDarkMode] = React.useState(true);

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-black/30">
        <div className="px-4 py-3 flex items-center gap-2 w-full justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-sky-400" />
            <div className="text-sm text-slate-700 dark:text-slate-400">PR Review Agent • LangGraph (Demo)</div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="p-4 w-full">
        <PRReviewAgent />
      </div>
    </div>
  );
}
