// PRReviewAgent.jsx
import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../apiConfig';
import ReactMarkdown from 'react-markdown';
import { stripHtml, allowedMarkdownElements } from '../markdown';
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MessageSquare,
  RefreshCw,
  Search,
  Wand2,
  XCircle
} from 'lucide-react';

import Button from './ui/Button';
import Badge from './ui/Badge';
import Switch from './ui/Switch';
import PRCard, { PRCardSkeleton } from './PRCard';
import FileTree, { buildFileTree } from './FileTree';

const severityTone = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  minor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

const severityOrder = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  minor: 5,
};

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
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBySeverity, setSortBySeverity] = useState(true);
  const [issueIndex, setIssueIndex] = useState(-1);

  const [repoError, setRepoError] = useState(null);
  const [prError, setPrError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [patchError, setPatchError] = useState(null);

  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const [fileTreeWidth, setFileTreeWidth] = useState(260);

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

  // Load PRs whenever the selected repository changes.  When a repo is
  // selected, this effect fetches all pull requests for that repo,
  // updating the list and selecting the first PR by default.  If no
  // repository is selected, the PR list is cleared.
  React.useEffect(() => {
    if (!selectedRepo) {
      setPrs([]);
      setSelectedPR(null);
      setPrError(null);
      return;
    }
    setLoadingPRs(true);
    setPrError(null);
    axios
      .get(apiUrl('prs', `/api/prs?owner=${owner}&repo=${selectedRepo}`))
      .then((r) => {
        const list = r.data || [];
        setPrs(list);
        setSelectedPR(list.length ? list[0] : null);
        setPrError(null);
      })
      .catch((err) => {
        console.error(err);
        setPrError('Failed to load pull requests');
      })
      .finally(() => setLoadingPRs(false));
  }, [selectedRepo]);

  // Load repositories on mount.  This fetches a list of repositories for
  // the specified owner and selects the first one by default.  Once a
  // repository is selected, a separate effect will fetch its PRs.
  React.useEffect(() => {
    setLoadingRepos(true);
    setRepoError(null);
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
        setRepoError(null);
      })
      .catch((err) => {
        console.error(err);
        setRepoError('Failed to load repositories');
      })
      .finally(() => setLoadingRepos(false));
  }, []);

  // Load files+contents when PR selected
  React.useEffect(() => {
    if (!selectedPR) {
      setFileError(null);
      return;
    }

    // reset state to avoid stale flashes
    setFiles([]);
    setContents({});
    setActiveFile(null);
    setCode('');
    setExpandedIssue(null);
    setIssues([]);
    setSummary('');
    setIssueIndex(-1);
    setLoadingReview(true);

    setLoadingFiles(true);
    setFileError(null);
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
        setFileError(null);
      })
      .catch((err) => {
        console.error(err);
        setFileError('Failed to load files');
      })
      .finally(() => setLoadingFiles(false));
  }, [selectedPR?.id]);

  // Update code whenever activeFile or contents change
  React.useEffect(() => {
    if (!activeFile) return;
    setCode(contents[activeFile] || '');
    setExpandedIssue(null);
  }, [activeFile, contents]);

  // Run AI review only after all files have finished loading
  React.useEffect(() => {
    if (!selectedPR || loadingFiles) return;
    runAIReview();
  }, [selectedPR, loadingFiles]);

  const lines = useMemo(() => (code || '').split('\n'), [code]);
  const lineRefs = useRef({});

  const visibleIssues = useMemo(() => {
    let items = issues;
    if (severityFilter !== 'all') {
      items = items.filter(i => i.severity === severityFilter);
    }
    if (sortBySeverity) {
      items = [...items].sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );
    }
    return items;
  }, [issues, severityFilter, sortBySeverity]);

  const activeFileIndex = useMemo(() => files.indexOf(activeFile), [files, activeFile]);

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

  React.useEffect(() => {
    if (issueIndex >= visibleIssues.length) {
      setIssueIndex(visibleIssues.length - 1);
    }
    if (!visibleIssues.length) {
      setIssueIndex(-1);
    }
  }, [visibleIssues, issueIndex]);

  function scrollToLine(n){
    const el = lineRefs.current[n];
    if(!el) return;
    el.scrollIntoView({block:'center', behavior:'smooth'});
    el.classList.add('ring-2','ring-sky-400');
    setTimeout(()=>el.classList.remove('ring-2','ring-sky-400'),1000);
  }

  function startResizing(e){
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = fileTreeWidth;

    function onMouseMove(ev){
      const newWidth = Math.min(600, Math.max(150, startWidth + ev.clientX - startX));
      setFileTreeWidth(newWidth);
    }

    function onMouseUp(){
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  async function runAIReview(){
    if(!selectedPR) return;

    const commitCount = selectedPR.commit ?? selectedPR.commits ?? 0;
    const updatedDate = selectedPR.updatedAt ?? selectedPR.updated ?? selectedPR.updatedAgo ?? '';
    const cacheKey = `aiReview:${owner}:${selectedRepo}:${selectedPR.id}`;

    // Attempt to load cached review
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.commit === commitCount && parsed.updated === updatedDate) {
          setIssues(parsed.issues || []);
          setSummary(parsed.summary || '');

          const stats = (parsed.issues || []).reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
          }, { critical: 0, high: 0, medium: 0, low: 0, minor: 0 });

          const prId = selectedPR.id;
          setPrs(currentPrs =>
            currentPrs.map(p =>
              p.id === prId ? { ...p, issueStats: stats, aiReviewed: true } : p
            )
          );
          return; // use cache
        }
      }
    } catch (err) {
      console.error('Failed to read review cache', err);
    }

    setLoadingReview(true);
    setReviewError(null);
    try {
      const res = await axios.post(
        apiUrl('prs', `/api/review/${owner}/${selectedRepo}/${selectedPR.id}`)
      );
      const reviewIssues = res.data?.issues || [];
      const reviewSummary = res.data?.summary || '';

      setIssues(reviewIssues);
      setSummary(reviewSummary);

      // Calculate stats and update the PR list state
      const stats = reviewIssues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0, minor: 0 });

      const prId = selectedPR.id;
      // Only update the main PRs list. DO NOT update selectedPR state here to avoid loops.
      setPrs(currentPrs =>
        currentPrs.map(p =>
          p.id === prId ? { ...p, issueStats: stats, aiReviewed: true } : p
        )
      );

      // Cache successful response
      try {
        if (typeof localStorage !== 'undefined' && res.status >= 200 && res.status < 300) {
          const toCache = {
            issues: reviewIssues,
            summary: reviewSummary,
            commit: commitCount,
            updated: updatedDate,
          };
          localStorage.setItem(cacheKey, JSON.stringify(toCache));
        }
        setReviewError(null);
      } catch (err) {
        console.error('Failed to cache review response', err);
      }
    } catch (e) {
      console.error(e);
      setReviewError('Failed to run AI review');
    } finally {
      setLoadingReview(false);
    }
  }

  React.useEffect(() => {
    function handleKey(e){
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight') {
          const nextIdx = (activeFileIndex + 1) % files.length;
          if (files[nextIdx]) setActiveFile(files[nextIdx]);
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          const prevIdx = (activeFileIndex - 1 + files.length) % files.length;
          if (files[prevIdx]) setActiveFile(files[prevIdx]);
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (!visibleIssues.length) return;
          const nextIssueIdx = (issueIndex + 1) % visibleIssues.length;
          const issue = visibleIssues[nextIssueIdx];
          setActiveFile(issue.file);
          scrollToLine(issue.line);
          setExpandedIssue(issue.line);
          setIssueIndex(nextIssueIdx);
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          if (!visibleIssues.length) return;
          const prevIssueIdx = (issueIndex - 1 + visibleIssues.length) % visibleIssues.length;
          const issue = visibleIssues[prevIssueIdx];
          setActiveFile(issue.file);
          scrollToLine(issue.line);
          setExpandedIssue(issue.line);
          setIssueIndex(prevIssueIdx);
          e.preventDefault();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeFileIndex, files, visibleIssues, issueIndex]);

  async function applyPatch(issue){
    if(!issue.patch) return;
    setPatchError(null);
    try {
      await axios.post(apiUrl('patch','/api/patch'), { prId: selectedPR.id, file: issue.file, before: issue.patch.before, after: issue.patch.after });
      setCode(prev=>prev.replace(issue.patch.before, issue.patch.after));
      setPatchError(null);
    } catch (e) {
      console.error(e);
      setPatchError('Failed to apply patch');
    }
    setShowFix(null);
  }

    // Filter issues to only show those for the current file
    const currentFileIssues = useMemo(() => {
      if (!activeFile) return [];
      return visibleIssues.filter(issue => issue.file === activeFile);
    }, [visibleIssues, activeFile]);

  return (
    <div className="grid gap-4 sm:grid-cols-10">
      {/* Left */}
      <div className="sm:col-span-2 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
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
        {repoError && (
          <div className="mb-2 flex items-center text-xs text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> {repoError}
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
          {prError && (
            <div className="text-xs text-red-400 flex items-center p-2 bg-red-500/10 rounded">
              <XCircle className="h-3 w-3 mr-1" /> {prError}
            </div>
          )}
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

      {/* Center */}
      <div className="sm:col-span-6 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {isFileTreeOpen && (
            <div style={{ width: fileTreeWidth }} className="relative flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <span className="text-sm font-medium text-slate-200">Files</span>
                <div className="flex items-center gap-2">
                  <Badge className="border-sky-500/30 text-sky-300 font-medium">
                    {loadingFiles ? <RefreshCw className="h-3 w-3 animate-spin" /> : files.length}
                  </Badge>
                  <button onClick={() => setIsFileTreeOpen(false)} className="text-slate-400 hover:text-slate-200">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="scroll-y flex-1 p-2">
                {fileError && (
                  <div className="text-xs text-red-400 flex items-center p-2 bg-red-500/10 rounded mb-2">
                    <XCircle className="h-3 w-3 mr-1" /> {fileError}
                  </div>
                )}
                {loadingFiles ? (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading...
                  </div>
                ) : files.length > 0 ? (
                  <FileTree tree={buildFileTree(files)} onFileClick={setActiveFile} activeFile={activeFile} />
                ) : (
                  <div className="text-center text-xs text-slate-500 py-4">No files in PR.</div>
                )}
              </div>
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-white/10"
                onMouseDown={startResizing}
              />
            </div>
          )}

          {/* Code viewer */}
          <div className={`flex-1 flex flex-col overflow-hidden ${isFileTreeOpen ? 'pl-3' : ''}`}>
            <div className="flex items-center justify-between p-2 bg-black/30 rounded-t-xl border-b border-white/10">
              <div className="flex items-center gap-2">
                {!isFileTreeOpen && (
                  <button onClick={() => setIsFileTreeOpen(true)} className="text-slate-400 hover:text-slate-200">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <span className="font-mono text-sm text-slate-300 truncate" title={activeFile}>{activeFile || 'No file selected'}</span>
              </div>
              <span className="text-xs text-slate-400">{lines.length} lines</span>
            </div>
            <div className="grow overflow-hidden rounded-b-xl border border-white/10 bg-black/30">
              {loadingFiles ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                  <span className="ml-3 text-slate-400 font-normal">Loading file...</span>
                </div>
              ) : fileError ? (
                <div className="flex items-center justify-center h-full text-red-400 text-sm">
                  <XCircle className="h-4 w-4 mr-2" /> {fileError}
                </div>
              ) : (
                <div className="scroll-y h-full">
                  <pre className="relative block w-full font-mono text-[12.5px] font-normal leading-6">
                    {lines.map((text, idx) => {
                      const lineNo = idx + 1;
                      const issue = currentFileIssues.find(i => i.line === lineNo);
                      const isIssue = Boolean(issue);
                      const isExpanded = expandedIssue === lineNo;

                      return (
                        <React.Fragment key={lineNo}>
                          <div
                            ref={el => lineRefs.current[lineNo] = el}
                            className={`grid grid-cols-[46px_1fr] gap-3 px-3 py-0.5 transition-colors ${
                              isIssue ? 'bg-red-500/10 cursor-pointer hover:bg-red-500/20' : ''
                            } ${isExpanded ? 'bg-red-500/20' : ''}`}
                            onClick={() => isIssue && setExpandedIssue(isExpanded ? null : lineNo)}
                          >
                            <div className="select-none text-right text-slate-500 flex items-center justify-end">
                              {isIssue && <AlertTriangle className="h-3.5 w-3.5 text-red-400 mr-2" />}
                              {lineNo}
                            </div>
                            <div className="whitespace-pre text-slate-200 font-mono font-normal">
                              {text || ' '}
                            </div>
                          </div>
                          {isExpanded && issue && (
                            <div className="bg-black/50 border-t border-b border-red-500/30 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={`${severityTone[issue.severity]} font-medium text-xs px-2 py-1 shrink-0`}>
                                      {issue.severity}
                                    </Badge>
                                    <h4 className="text-sm font-semibold text-slate-200 leading-tight">
                                      {issue.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs font-normal text-slate-300 leading-relaxed break-words">
                                    {issue.description}
                                  </p>
                                </div>
                                {issue.patch && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowFix(issue);
                                    }}
                                    size="sm"
                                    className="font-medium bg-sky-600 hover:bg-sky-500 border-sky-500/30 text-white shrink-0"
                                  >
                                    <Wand2 className="h-3 w-3" />
                                    Fix
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
     {/* Right */}
      <div className="sm:col-span-2 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex items-center justify-between text-sm font-medium text-slate-300 mb-3">
          <span>AI Review</span>
          {loadingReview && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        {reviewError && (
          <div className="mb-2 flex items-center text-xs text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> {reviewError}
          </div>
        )}
        {patchError && (
          <div className="mb-2 flex items-center text-xs text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> {patchError}
          </div>
        )}

        {/* Summary Section */}
        <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3">
          {loadingReview ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-1/2 bg-white/10 rounded" />
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-3/4 bg-white/10 rounded" />
            </div>
          ) : (
            <div className="text-sm font-normal text-slate-300 leading-relaxed break-words prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[stripHtml]}
                allowedElements={allowedMarkdownElements}
              >
                {summary || 'Run AI review to see insights.'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Issue controls */}
        <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
          <label htmlFor="severity-filter">Severity</label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded px-1.5 py-1 text-slate-200"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="minor">Minor</option>
          </select>
          <Button
            onClick={() => setSortBySeverity(s => !s)}
            size="sm"
            variant="outline"
            className="h-7 px-2"
            aria-label="Sort by severity"
          >
            <ChevronsUpDown className={`h-3.5 w-3.5 ${sortBySeverity ? 'text-sky-300' : ''}`} />
          </Button>
          <span className="ml-auto text-slate-500">Ctrl+←/→ files, Ctrl+↑/↓ issues</span>
        </div>

        {/* Issues List - Show all issues but highlight current file */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loadingReview ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl border border-white/10 bg-black/20 animate-pulse"></div>
            ))
          ) : (
            <>
          {visibleIssues.map((issue, idx) => (
            <div
              key={issue.id}
              onClick={() => {
                setActiveFile(issue.file);
                scrollToLine(issue.line);
                setExpandedIssue(issue.line);
                setIssueIndex(idx);
              }}
              className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                issue.file === activeFile && expandedIssue === issue.line
                  ? 'border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-500/30'
                  : issue.file === activeFile
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
                    <h4 className="text-sm font-semibold text-slate-200 leading-tight break-all">
                      {issue.title}
                    </h4>
                  </div>
                  {issue.patch && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFix(issue);
                      }} 
                      size="sm" 
                      className="font-medium bg-sky-600 hover:bg-sky-500 border-sky-500/30 text-white shrink-0"
                    >
                      <Wand2 className="h-3 w-3" />
                      Fix
                    </Button>
                  )}
                </div>

                {/* Description */}
                <div className="text-xs font-normal text-slate-300 leading-relaxed break-words">
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
          {visibleIssues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400 mb-1">No issues found</p>
              <p className="text-xs text-slate-500">Run AI review to analyze your code</p>
            </div>
          )}
          </>
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
        ) }
  </div>);
  }
    
     