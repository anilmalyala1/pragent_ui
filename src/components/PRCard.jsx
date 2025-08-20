import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  FileText,
  Clock,
  Hash,
  Bot as BotIcon,
  User,
  ChevronsUpDown as ToggleIcon,
} from 'lucide-react';

// Display a pull request in the list on the left.
export default function PRCard({ pr, selected, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const fileCount = Array.isArray(pr.files) ? pr.files.length : 0;
  const firstFiles = (pr.files || []).slice(0, 3);
  const overflow = Math.max(0, fileCount - firstFiles.length);
  const avatar = pr.author ? `https://github.com/${pr.author}.png?size=40` : null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      className={`w-full text-left rounded-lg border px-2.5 py-1.5 transition ${
        selected
          ? 'border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-400/30'
          : 'border-white/10 bg-black/30 hover:bg-white/5'
      }`}
    >
      {/* Title row */}
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-medium text-slate-200">
              {pr.title || '(no title)'}
            </div>
            {pr.aiReviewed && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-600/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                <BotIcon className="h-[12px] w-[12px]" /> AI
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {pr.updatedAgo}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                setExpanded(v => !v);
              }}
              className="ml-1 text-slate-400 hover:text-slate-200"
              aria-label={expanded ? 'Collapse metadata' : 'Expand metadata'}
            >
              <ToggleIcon
                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {expanded && (
            <>
              {/* Meta row */}
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span title={pr.repo} className="truncate">
                  {pr.repo}
                </span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 truncate" title={pr.branch}>
                  <GitBranch className="h-3.5 w-3.5" />
                  {pr.branch}
                </span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />#{pr.id}
                </span>
                {pr.headSha && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1" title={pr.headSha}>
                      <Hash className="h-3.5 w-3.5" />
                      {String(pr.headSha).slice(0, 7)}
                    </span>
                  </>
                )}
              </div>

              {/* Stats row */}
              <div className="mt-1.5 flex items-center gap-2.5 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <GitCommit className="h-3.5 w-3.5" />
                  {pr.commit ?? 0} commit{(pr.commit ?? 0) === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {fileCount} file{fileCount === 1 ? '' : 's'}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-slate-500">
                  by <span className="text-slate-300">{pr.author || 'unknown'}</span>
                </span>
              </div>

              {/* File chips preview */}
              {fileCount > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {firstFiles.map(name => (
                    <span
                      key={name}
                      title={name}
                      className="max-w-[220px] truncate rounded-md border border-white/10 bg-black/20 px-1 py-0.5 font-mono text-[10px] text-slate-300"
                    >
                      {name}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="rounded-md border border-white/10 bg-black/20 px-1 py-0.5 text-[10px] text-slate-400">
                      +{overflow} more
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="shrink-0">
          {avatar ? (
            <img
              alt={pr.author}
              src={avatar}
              className="h-6 w-6 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full border border-white/10 bg-white/10 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton placeholder while pull requests load
export function PRCardSkeleton() {
  return (
    <div className="w-full rounded-lg border border-white/10 bg-black/30 p-2.5">
      <div className="animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="mt-1.5 h-3 bg-slate-700 rounded w-1/2"></div>
        <div className="mt-3 flex items-center gap-2.5 text-xs text-slate-400">
          <div className="h-4 w-16 bg-slate-700 rounded"></div>
          <div className="h-4 w-16 bg-slate-700 rounded"></div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <div className="h-5 w-24 bg-slate-700 rounded-md"></div>
          <div className="h-5 w-20 bg-slate-700 rounded-md"></div>
          <div className="h-5 w-28 bg-slate-700 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

