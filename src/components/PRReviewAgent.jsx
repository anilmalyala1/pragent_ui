// PRReviewAgent.jsx
import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../apiConfig';
import {
  AlertTriangle, Bot, Check, ChevronLeft, ChevronRight, ChevronsUpDown,
  MessageSquare, RefreshCw, Search, Wand2, XCircle
} from 'lucide-react';

/** Minimal UI helpers */
const Button = ({ children, className = '', ...props }) => (
  <button className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition ${className}`} {...props}>
    {children}
  </button>
);

const Badge = ({ children, className = '', ...props }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`} {...props}>
    {children}
  </span>
);

const Switch = ({ checked, onChange, ...props }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-black ${checked ? 'bg-sky-500' : 'bg-white/20'}`}
    {...props}
  >
    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
  </button>
);

const severityTone = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  minor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

import {
  GitBranch, GitCommit, FileText, Clock, Hash, Bot as BotIcon, User
} from 'lucide-react';

function PRCard({ pr, selected, onClick }) {
  const fileCount = Array.isArray(pr.files) ? pr.files.length : 0;
  const firstFiles = (pr.files || []).slice(0, 3);
  const overflow = Math.max(0, fileCount - firstFiles.length);
  const avatar = pr.author ? `https://github.com/${pr.author}.png?size=40` : null;

  return (
    <button
      onClick={onClick}
      aria-selected={selected}
      className={`w-full text-left rounded-xl border px-3 py-2 transition
        ${selected
          ? 'border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-400/30'
          : 'border-white/10 bg-black/30 hover:bg-white/5'}`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
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
          </div>

          {/* Meta row */}
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span title={pr.repo} className="truncate">{pr.repo}</span>
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
        </div>

        {/* Avatar */}
        <div className="shrink-0">
          {avatar ? (
            <img
              alt={pr.author}
              src={avatar}
              className="h-7 w-7 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full border border-white/10 bg-white/10 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          {firstFiles.map(name => (
            <span
              key={name}
              title={name}
              className="max-w-[220px] truncate rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
            >
              {name}
            </span>
          ))}
          {overflow > 0 && (
            <span className="rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 text-[11px] text-slate-400">
              +{overflow} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export default function PRReviewAgent(){

  // Data from server
  // Owner of the repositories to review.  Adjust this value as needed.
  const owner = 'anilmalyala1';

  // List of repositories and the currently selected repository.  Repositories
  // are loaded on initial mount via a dedicated endpoint.  Selecting a
  // repository triggers loading of its pull requests.
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const repoDropdownRef = useRef(null);


  // Pull requests scoped to the selected repository and the currently
  // selected pull request.
  const [prs, setPrs] = useState([]);
  const [selectedPR, setSelectedPR] = useState(null);

  const [files, setFiles] = useState([]);
  const [contents, setContents] = useState({});      // map filename -> content
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');

  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState('');

  // Loading states
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const [filterMine, setFilterMine] = useState(false);
  const [filterAI, setFilterAI] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyAI, setOnlyAI] = useState(false);
  const [showFix, setShowFix] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{role:'assistant', text:'Hey! Ask me about any flagged issue or request a patch.'}]);

  // --- Close repo dropdown on outside click ---
  React.useEffect(() => {
      function handleClickOutside(event) {
          if (repoDropdownRef.current && !repoDropdownRef.current.contains(event.target)) {
              setRepoDropdownOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, [repoDropdownRef]);

  const filteredRepos = useMemo(() => {
      if (!repoSearch) return repos;
      return repos.filter(repo => repo.toLowerCase().includes(repoSearch.toLowerCase()));
  }, [repos, repoSearch]);


  // --- Tabs scrolling helpers ---
  const tabsRef = useRef(null);
  function scrollTabs(dir = 1) {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }
  React.useEffect(() => {
    // Ensure active tab is visible when it changes
    if (!tabsRef.current || !activeFile) return;
    const btn = tabsRef.current.querySelector(`[data-file="${CSS.escape(activeFile)}"]`);
    if (btn) btn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [activeFile]);

  // Load PRs whenever the selected repository changes.  When a repo is
  // selected, this effect fetches all pull requests for that repo,
  // updating the list and selecting the first PR by default.  If no
  // repository is selected, the PR list is cleared.
  React.useEffect(() => {
    if (!selectedRepo) {
      setPrs([]);
      setSelectedPR(null);
      return;
    }
    setLoadingPRs(true);
    axios
      .get(apiUrl('prs', `/api/prs?owner=${owner}&repo=${selectedRepo}`))
      .then((r) => {
        const list = r.data || [];
        setPrs(list);
        setSelectedPR(list.length ? list[0] : null);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingPRs(false));
  }, [selectedRepo]);

  // Load repositories on mount.  This fetches a list of repositories for
  // the specified owner and selects the first one by default.  Once a
  // repository is selected, a separate effect will fetch its PRs.
  React.useEffect(() => {
    setLoadingRepos(true);
    axios
      .get(apiUrl('prs', `/api/repos?owner=${owner}`))
      .then((r) => {
        const list = r.data || [];
        // Normalize repository names from objects or strings
        const repoNames = list.map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.repo || item.name || '';
          }
          return '';
        });
        setRepos(repoNames);
        const defaultRepo = repoNames[0] || '';
        setSelectedRepo(defaultRepo);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingRepos(false));
  }, []);

  // Load files+contents when PR selected
  React.useEffect(() => {
    if (!selectedPR) return;

    // reset state to avoid stale flashes
    setFiles([]);
    setContents({});
    setActiveFile(null);
    setCode('');

    setLoadingFiles(true);
    axios
      // Use the dynamic owner and selected repository for file contents
      .get(
        apiUrl(
          'prs',
          `/api/files/prs/${owner}/${selectedRepo}/${selectedPR.id}/contents`
        )
      )
      .then((r) => {
        const { files: fList = [], contents: map = {} } = r.data || {};
        setFiles(fList);
        setContents(map);
        const first = fList[0] || null;
        setActiveFile(first);
        setCode(first ? map[first] || '' : '');
        runAIReview();
      })
      .catch(console.error)
      .finally(() => setLoadingFiles(false));
  }, [selectedPR]);

  // Update code whenever activeFile or contents change
  React.useEffect(() => {
    if (!activeFile) return;
    setCode(contents[activeFile] || '');
  }, [activeFile, contents]);

  // Run review after file/code is loaded
  React.useEffect(() => {
    if (!selectedPR) return;
    //runAIReview();
  }, [selectedPR, activeFile]);

  const lines = useMemo(()=> (code || '').split(' '), [code]);
  const lineRefs = useRef({});

  const visibleIssues = issues;

  const filteredPRs = useMemo(()=>{
    let items = [...prs];
    if(filterAI) items = items.filter(p=>p.aiReviewed);
    if(search.trim()){
      const s = search.toLowerCase();
      items = items.filter(p => (p.title+p.author+p.repo+p.branch).toLowerCase().includes(s));
    }
    if(filterMine) items = items.filter(p=>p.author==='alice'); // tweak as needed
    return items;
  },[filterAI,filterMine,search, prs]);

  function scrollToLine(n){
    const el = lineRefs.current[n];
    if(!el) return;
    el.scrollIntoView({block:'center', behavior:'smooth'});
    el.classList.add('ring-2','ring-sky-400');
    setTimeout(()=>el.classList.remove('ring-2','ring-sky-400'),1000);
  }

  async function runAIReview(){
    if(!selectedPR) return;
    setLoadingReview(true);
    try {
      const res = await axios.post(
        apiUrl('prs', `/api/review/${owner}/${selectedRepo}/${selectedPR.id}`)
      );
      setIssues(res.data?.issues || []);
      setSummary(res.data?.summary || '');
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoadingReview(false);
    }
  }

  async function applyPatch(issue){
    if(!issue.patch) return;
    try {
      await axios.post(apiUrl('patch','/api/patch'), { prId: selectedPR.id, file: issue.file, before: issue.patch.before, after: issue.patch.after });
      setCode(prev=>prev.replace(issue.patch.before, issue.patch.after));
    } catch (e) { console.error(e); }
    setShowFix(null);
  }

    // Filter issues to only show those for the current file
    const currentFileIssues = useMemo(() => {
      if (!activeFile) return [];
      return visibleIssues.filter(issue => issue.file === activeFile);
    }, [visibleIssues, activeFile]);


    console.log('Active file:', activeFile);
    console.log('All issues:', visibleIssues);
    console.log('Current file issues:', currentFileIssues);
    console.log('Code lines:', lines.length);

  return (
    <div className="grid gap-4 sm:grid-cols-12">
      {/* Left */}
      <div className="sm:col-span-3 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex items-center justify-between text-sm font-medium text-slate-300 mb-2">
          <span>Pull Requests</span>
          <Badge className="border-sky-500/30 text-sky-300 font-medium">
            {loadingPRs ? <RefreshCw className="h-3 w-3 animate-spin" /> : filteredPRs.length}
          </Badge>
        </div>
        {/* Repository dropdown */}
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
                    <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      className="w-full bg-black/40 pl-8 pr-2 py-2 rounded-lg text-sm font-normal placeholder:text-slate-500 border border-white/10"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredRepos.length > 0 ? (
                    filteredRepos.map((repo) => (
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
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PRs…" className="w-full bg-black/40 pl-8 pr-2 py-2 rounded-lg text-sm font-normal placeholder:text-slate-500 border border-white/10"/>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
          <label className="flex items-center gap-2"><Switch checked={filterMine} onChange={setFilterMine}/> Mine</label>
          <label className="flex items-center gap-2"><Switch checked={filterAI} onChange={setFilterAI}/> Has AI</label>
        </div>
        <div className="scroll-y grow pr-1 space-y-2">
          {loadingPRs ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm font-normal text-slate-400">Loading PRs...</span>
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

      {/* Center */}
      <div className="sm:col-span-6 h:[78vh] sm:h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2 w-full">
          {loadingFiles ? (
            <div className="flex items-center gap-2 text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-xs font-normal">Loading files...</span>
            </div>
          ) : activeFile ? (
            <div className="relative flex-1 min-w-0">
              {/* Scroll buttons */}
              <button
                type="button"
                onClick={() => scrollTabs(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-md bg-black/40 border border-white/10 p-1 hover:bg-white/10"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-slate-300" />
              </button>
              <button
                type="button"
                onClick={() => scrollTabs(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-md bg-black/40 border border-white/10 p-1 hover:bg-white/10"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>

              {/* Gradient edges */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-black/70 to-transparent rounded-l-md" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-black/70 to-transparent rounded-r-md" />

              {/* Scroll container */}
              <div ref={tabsRef} className="overflow-x-auto whitespace-nowrap no-scrollbar px-8">
                {files.map((f) => (
                  <button
                    key={f}
                    data-file={f}
                    onClick={() => setActiveFile(f)}
                    className={`inline-flex items-center shrink-0 max-w-[220px] mr-2 rounded-md px-2 py-1 font-mono text-xs font-normal truncate ${
                      activeFile === f
                        ? 'bg-white/10 text-slate-200'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                    title={f}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs font-normal text-slate-400">No file</span>
          )}

          <span className="text-slate-400 font-normal">{lines.length} lines</span>
          <div className="ml-auto flex items-center gap-3 text-xs font-medium text-slate-400">
            <label className="flex items-center gap-2"><Switch checked={onlyAI} onChange={setOnlyAI}/> Show only AI</label>
          </div>
        </div>

           {/* Code viewer */}
           <div className="grow overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {loadingFiles ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-400 font-normal">Loading file contents...</span>
            </div>
          ) : (
            <div className="scroll-y h-full">
              <pre className="relative block w-full font-mono text-[12.5px] font-normal leading-6">
                {lines.map((text, idx)=>{
                  const lineNo = idx+1;
                  // Use the filtered issues for the current file
                  const issue = currentFileIssues.find(i => i.line === lineNo);
                  const isIssue = Boolean(issue);
                  return (
                    <div key={lineNo} ref={el=>lineRefs.current[lineNo]=el} className={`grid grid-cols-[46px_1fr] gap-3 px-3 py-0.5 ${isIssue?'bg-red-500/5':''}`}>
                      <div className="select-none text-right text-slate-500 font-mono font-normal">{lineNo}</div>
                      <div className="whitespace-pre text-slate-200 font-mono font-normal">
                        {text || ' '}
                        {issue && (
                          <button onClick={()=>setShowFix(issue)} className={`ml-3 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${severityTone[issue.severity]}`}>
                            <AlertTriangle className="h-[14px] w-[14px]"/> {issue.title}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button 
            onClick={runAIReview} 
            disabled={loadingReview}
            className="flex items-center gap-2 font-medium"
          >
            {loadingReview ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loadingReview ? 'Running Review...' : 'Re-run AI Review'}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 font-medium"><Check className="h-4 w-4"/> Approve</Button>
          <Button className="bg-red-600 hover:bg-red-500 border-red-500/30 font-medium"><XCircle className="h-4 w-4"/> Request Changes</Button>
        </div>
      </div>

     {/* Right */}
     <div className="sm:col-span-3 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex items-center justify-between text-sm font-medium text-slate-300 mb-3">
          <span>AI Review</span>
          {loadingReview && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        
        {/* Summary Section */}
        <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="text-sm font-normal text-slate-300 leading-relaxed">
            {summary || 'Run AI review to see insights.'}
          </div>
        </div>

        {/* Issues List - Show all issues but highlight current file */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {visibleIssues.map(issue => (
            <div 
              key={issue.id} 
              className={`rounded-xl border p-4 transition-colors ${
                issue.file === activeFile 
                  ? 'border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10' 
                  : 'border-white/10 bg-black/30 hover:bg-black/40'
              }`}
            >
              <div className="space-y-3">
                {/* Header with severity and title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge className={`${severityTone[issue.severity]} font-medium text-xs px-2 py-1 shrink-0`}>
                      {issue.severity}
                    </Badge>
                    <h4 className="text-sm font-semibold text-slate-200 leading-tight break-words">
                      {issue.title}
                    </h4>
                  </div>
                  {issue.patch && (
                    <Button 
                      onClick={() => setShowFix(issue)} 
                      size="sm" 
                      className="font-medium bg-sky-600 hover:bg-sky-500 border-sky-500/30 text-white shrink-0"
                    >
                      <Wand2 className="h-3 w-3" />
                      Fix
                    </Button>
                  )}
                </div>

                {/* Description */}
                <div className="text-xs font-normal text-slate-300 leading-relaxed">
                  {issue.description}
                </div>

                {/* Location and metadata */}
                <div className="flex items-center gap-3 text-xs font-normal text-slate-400 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Line {issue.line}
                  </span>
                  {issue.file && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className={`flex items-center gap-1 font-mono ${
                        issue.file === activeFile ? 'text-sky-300' : 'text-slate-400'
                      }`}>
                        <FileText className="h-3 w-3" />
                        {issue.file}
                      </span>
                    </>
                  )}
                  {/* Show indicator for current file */}
                  {issue.file === activeFile && (
                    <span className="text-sky-400 text-[10px] px-1.5 py-0.5 bg-sky-500/20 rounded border border-sky-500/30">
                      Current
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty state */}
          {visibleIssues.length === 0 && !loadingReview && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400 mb-1">No issues found</p>
              <p className="text-xs text-slate-500">Run AI review to analyze your code</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-black/90 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">AI Agent Chat</h3>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm font-normal ${
                    msg.role === 'user' 
                      ? 'bg-sky-500/20 text-sky-200' 
                      : 'bg-white/10 text-slate-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const t = e.target.text.value;
              if (!t.trim()) return;
              e.target.text.value = '';
              setMessages(m=>[...m,{role:'user',text:t}]);
              fetch(apiUrl('chat','/api/agent-chat'), {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: t })})
                .then(r=>r.json()).then(d=>setMessages(m=>[...m,{role:'assistant', text: d.reply }]))
                .catch(()=>setMessages(m=>[...m,{role:'assistant', text: 'Agent unavailable'}]));
            }}>
              <div className="flex gap-2">
                <input name="text" placeholder="Ask about issues or request patches..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm font-normal text-slate-200 placeholder:text-slate-500" />
                <Button type="submit" className="font-medium">Send</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fix Modal */}
      {showFix && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-black/90 border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Apply Fix</h3>
              <button onClick={() => setShowFix(null)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Before:</h4>
                <pre className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm font-mono font-normal text-red-200">
                  {showFix.patch.before}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">After:</h4>
                <pre className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm font-mono font-normal text-green-200">
                  {showFix.patch.after}
                </pre>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => applyPatch(showFix)} className="bg-green-600 hover:bg-green-500 border-green-500/30 font-medium">
                <Check className="h-4 w-4" />
                Apply Fix
              </Button>
              <Button onClick={() => setShowFix(null)} variant="outline" className="font-medium">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
