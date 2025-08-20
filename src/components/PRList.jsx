import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  FileText,
  Clock,
  Hash,
  Bot as BotIcon,
  User,
  ChevronsUpDown as ToggleIcon,
  ChevronsUpDown,
  Search,
  RefreshCw,
  Check
} from 'lucide-react';
import Badge from './ui/Badge';
import Switch from './ui/Switch';

function PRCard({ pr, selected, onClick }) {
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
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-medium text-slate-200">{pr.title || '(no title)'}</div>
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
              <ToggleIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {expanded && (
            <>
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

function PRCardSkeleton() {
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

export default function PRList({
  repos,
  selectedRepo,
  setSelectedRepo,
  loadingRepos,
  prs,
  selectedPR,
  setSelectedPR,
  loadingPRs,
}) {
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const repoDropdownRef = useRef(null);

  const [filterMine, setFilterMine] = useState(false);
  const [filterAI, setFilterAI] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(event.target)) {
        setRepoDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRepos = useMemo(() => {
    if (!repoSearch) return repos;
    return repos.filter(repo => repo.toLowerCase().includes(repoSearch.toLowerCase()));
  }, [repos, repoSearch]);

  const filteredPRs = useMemo(() => {
    let items = [...prs];
    if (filterAI) items = items.filter(p => p.aiReviewed);
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(p => (p.title + p.author + p.repo + p.branch).toLowerCase().includes(s));
    }
    if (filterMine) items = items.filter(p => p.author === 'alice');
    return items;
  }, [filterAI, filterMine, search, prs]);

  return (
    <div className="sm:col-span-2 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
      <div className="flex items-center justify-between text-sm font-medium text-slate-300 mb-2">
        <span>Pull Requests</span>
        <Badge className="border-sky-500/30 text-sky-300 font-medium">
          {loadingPRs ? <RefreshCw className="h-3 w-3 animate-spin" /> : filteredPRs.length}
        </Badge>
      </div>
      {loadingRepos ? (
        <div className="flex items-center justify-center mb-3 h-10">
          <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-400">Loading repos…</span>
        </div>
      ) : (
        <div className="relative mb-3" ref={repoDropdownRef}>
          <button
            onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
            className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-normal text-slate-200"
          >
            <span className="truncate">{selectedRepo || 'Select a repository'}</span>
            <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
          {repoDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-[#1c1c1c] border border-white/20 rounded-lg shadow-lg">
              <div className="p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={repoSearch}
                    onChange={e => setRepoSearch(e.target.value)}
                    className="w-full bg-black/40 pl-8 pr-2 py-2 rounded-lg text-sm font-normal placeholder:text-slate-500 border border-white/10"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map(repo => (
                    <button
                      key={repo}
                      onClick={() => {
                        setSelectedRepo(repo);
                        setRepoDropdownOpen(false);
                        setRepoSearch('');
                      }}
                      className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-200 hover:bg-white/10"
                    >
                      <span className="flex-1 truncate">{repo}</span>
                      {repo === selectedRepo && <Check className="h-4 w-4 text-sky-400" />}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-500 py-2">No repositories found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PRs…"
            className="w-full bg-black/40 pl-8 pr-2 py-2 rounded-lg text-sm font-normal placeholder:text-slate-500 border border-white/10"
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
        <label className="flex items-center gap-2"><Switch checked={filterMine} onChange={setFilterMine} /> Mine</label>
        <label className="flex items-center gap-2"><Switch checked={filterAI} onChange={setFilterAI} /> Has AI</label>
      </div>
      <div className="scroll-y grow pr-1 space-y-2">
        {loadingPRs ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <PRCardSkeleton key={i} />)}
          </div>
        ) : (
          filteredPRs.map(pr => (
            <PRCard
              key={pr.id}
              pr={pr}
              selected={selectedPR?.id === pr.id}
              onClick={() => setSelectedPR(pr)}
            />
          ))
        )}
      </div>
    </div>
  );
}

