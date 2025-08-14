
import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../apiConfig';
import { AlertTriangle, Bot, Check, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, Search, Wand2, XCircle } from 'lucide-react';

/** Minimal UI helpers */
const Button = ({ className='', children, ...props }) => (
  <button className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition border border-white/10 bg-white/5 hover:bg-white/10 ${className}`} {...props}>{children}</button>
);
const Badge = ({ className='', children }) => (
  <span className={`inline-flex items-center rounded-md border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide ${className}`}>{children}</span>
);
const Switch = ({ checked, onChange }) => (
  <label className="inline-flex items-center cursor-pointer">
    <input type="checkbox" className="hidden" checked={checked} onChange={e=>onChange(e.target.checked)} />
    <span className={`w-9 h-[22px] rounded-full relative transition ${checked?'bg-sky-600':'bg-white/10'}`}>
      <span className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white transition ${checked?'translate-x-[1.25rem]':''}`}></span>
    </span>
  </label>
);

const severityTone = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  major: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  minor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export default function PRReviewAgent(){

// Data from server
const [prs, setPrs] = useState([]);
const [selectedPR, setSelectedPR] = useState(null);
const [files, setFiles] = useState([]);
const [activeFile, setActiveFile] = useState(null);
const [code, setCode] = useState('');
const [issues, setIssues] = useState([]);
const [summary, setSummary] = useState('');


  const [filterMine, setFilterMine] = useState(false);
  const [filterAI, setFilterAI] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyAI, setOnlyAI] = useState(false);
  const [showFix, setShowFix] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  //const [code, setCode] = useState(SAMPLE_CODE);
  const [messages, setMessages] = useState([{role:'assistant', text:'Hey! Ask me about any flagged issue or request a patch.'}]);


// Load PRs on mount
React.useEffect(() => {
  axios.get(apiUrl('prs','/api/prs')).then(r => {
    setPrs(r.data || []);
    if ((r.data || []).length) {
      setSelectedPR(r.data[0]);
    }
  }).catch(console.error);
}, []);

// Load files when PR selected
React.useEffect(() => {
  if (!selectedPR) return;
  axios.get(apiUrl('prs', `/api/prs/${selectedPR.id}/files`)).then(r => {
    setFiles(r.data || []);
    const f = (r.data || [])[0] || null;
    setActiveFile(f);
    if (f) {
      axios.get(apiUrl('prs', `/api/file/${f}`)).then(rr => setCode(rr.data?.code || '')).catch(console.error);
    } else {
      setCode('');
    }
  }).catch(console.error);
}, [selectedPR]);

// Run review after file/code is loaded
React.useEffect(() => {
  if (!selectedPR) return;
  runAIReview();
}, [selectedPR, activeFile]);

  const lines = useMemo(()=>code.split('\n'),[code]);
  const lineRefs = useRef({});

  
  const visibleIssues = issues; // toggle could filter later

  const filteredPRs = useMemo(()=>{
    let items = [...prs];
    if(filterAI) items = items.filter(p=>p.aiReviewed);
    if(search.trim()){
      const s = search.toLowerCase();
      items = items.filter(p => (p.title+p.author+p.repo+p.branch).toLowerCase().includes(s));
    }
    if(filterMine) items = items.filter(p=>p.author==='alice');
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
    try {
      const res = await axios.post(apiUrl('review', `/api/review/${selectedPR.id}`));
      setIssues(res.data?.issues || []);
      setSummary(res.data?.summary || '');
    } catch (e) { console.error(e); }
  }
  async function applyPatch(issue){
    if(!issue.patch) return;
    try {
      await axios.post(apiUrl('patch','/api/patch'), { prId: selectedPR.id, file: issue.file, before: issue.patch.before, after: issue.patch.after });
      setCode(prev=>prev.replace(issue.patch.before, issue.patch.after));
    } catch (e) { console.error(e); }
    setShowFix(null);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-12">
      {/* Left */}
      <div className="sm:col-span-3 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
          <span>Pull Requests</span>
          <Badge className="border-sky-500/30 text-sky-300">{filteredPRs.length}</Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PRs…" className="w-full bg-black/40 pl-8 pr-2 py-2 rounded-lg text-sm placeholder:text-slate-500 border border-white/10"/>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <label className="flex items-center gap-2"><Switch checked={filterMine} onChange={setFilterMine}/> Mine</label>
          <label className="flex items-center gap-2"><Switch checked={filterAI} onChange={setFilterAI}/> Has AI</label>
        </div>
        <div className="scroll-y grow pr-1 space-y-2">
          {filteredPRs.map(pr=>(
            <button key={pr.id} onClick={()=>setSelectedPR(pr)} className={`w-full rounded-xl border px-3 py-2 text-left transition ${selectedPR.id===pr.id?'border-sky-500/30 bg-sky-500/10':'border-white/10 bg-black/30 hover:bg-white/5'}`}>
              <div className="flex items-center justify-between text-sm">
                <div className="truncate font-medium text-slate-200">{pr.title}</div>
                {pr.aiReviewed && <Badge className="bg-violet-600/70 border-transparent">AI</Badge>}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span className="truncate">{pr.repo}</span><span>•</span><span className="truncate">{pr.branch}</span>
                <span className="ml-auto">{pr.updatedAgo} ago</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center */}
      <div className="sm:col-span-6 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3 flex flex-col">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
          {activeFile ? (<>

          <div className="flex items-center gap-2">
          
          {files.map(f => (
            <button key={f} onClick={()=>{setActiveFile(f); axios.get(apiUrl('prs', `/api/file/${f}`)).then(rr=> setCode(rr.data?.code||'')).catch(console.error);}} className={`rounded-md px-2 py-1 font-mono text-xs ${activeFile===f?'bg-white/10 text-slate-200':'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{f}</button>
          ))}
          
          </div>
        </>) : (<span className="rounded-md bg-white5 px-2 py-1 font-mono text-xs text-slate-400\">No file</span>)}
          <span className="text-slate-400">{lines.length} lines</span>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
            <label className="flex items-center gap-2"><Switch checked={onlyAI} onChange={setOnlyAI}/> Show only AI</label>
            <div className="inline-flex items-center gap-1 rounded-lg bg-black/30 px-2 py-1"><ChevronLeft className="h-4 w-4"/><ChevronRight className="h-4 w-4"/></div>
          </div>
        </div>
        <div className="grow overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <div className="scroll-y h-full">
            <pre className="relative block w-full font-mono text-[12.5px] leading-6">
              {lines.map((text, idx)=>{
                const lineNo = idx+1;
                const issue = visibleIssues.find(i=>i.line===lineNo);
                const isIssue = Boolean(issue);
                return (
                  <div key={lineNo} ref={el=>lineRefs.current[lineNo]=el} className={`grid grid-cols-[46px_1fr] gap-3 px-3 py-0.5 ${isIssue?'bg-red-500/5':''}`}>
                    <div className="select-none text-right text-slate-500">{lineNo}</div>
                    <div className="whitespace-pre text-slate-200">
                      {text || ' '}
                      {issue && (
                        <button onClick={()=>setShowFix(issue)} className={`ml-3 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${severityTone[issue.severity]}`}>
                          <AlertTriangle className="h-[14px] w-[14px]"/> {issue.title}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={runAIReview}><RefreshCw className="h-4 w-4"/> Re-run AI Review</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30"><Check className="h-4 w-4"/> Approve</Button>
          <Button className="bg-red-600 hover:bg-red-500 border-red-500/30"><XCircle className="h-4 w-4"/> Request Changes</Button>
          <Button className="ml-auto" onClick={()=>setChatOpen(true)}><Bot className="h-4 w-4"/> Chat with AI</Button>
        </div>
      </div>

      {/* Right */}
      <div className="sm:col-span-3 h-[78vh] border border-white/10 rounded-2xl bg-white/5 p-3">
        <div className="mb-3 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-slate-300">
          {summary || 'Run AI review to see insights.'}
        </div>
        {['security','quality','performance','best_practice'].map(cat=>{
          const list = issues.filter(i=>i.category===cat);
          if(!list.length) return null;
          return (
            <div key={cat} className="mb-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <div className="flex items-center gap-2">
                  {cat==='security'?<AlertTriangle className="h-4 w-4 text-slate-300"/>:<Wand2 className="h-4 w-4 text-slate-300"/>}
                  {cat==='security'?'Security':'Code Quality'}
                </div>
                <Badge>{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.map(iss=>(
                  <button key={iss.id} onClick={()=>scrollToLine(iss.line)} className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-left hover:border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-200">{iss.title}</div>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] ${severityTone[iss.severity]}`}>{iss.severity}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-400">{iss.description}</div>
                    <div className="mt-2 flex items-center gap-2">
                      {iss.patch && <Button onClick={(e)=>{e.stopPropagation(); setShowFix(iss);}} className="bg-sky-600 hover:bg-sky-500 border-sky-500/30"><Wand2 className="h-4 w-4"/> Apply Suggestion</Button>}
                      <Button onClick={(e)=>{e.stopPropagation(); scrollToLine(iss.line);}} className=""><ChevronRight className="h-4 w-4"/> Jump to line {iss.line}</Button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showFix && (
        <div className="modal-backdrop" onClick={()=>setShowFix(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header text-slate-100 font-semibold">Fix Preview</div>
            <div className="modal-body space-y-3">
              <div className="text-sm text-slate-400">{showFix.title}</div>
              {showFix.patch ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <CodeBlock title="Before" code={showFix.patch.before} tone="red"/>
                  <CodeBlock title="After" code={showFix.patch.after} tone="emerald"/>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-slate-300">
                  No auto-fix available. Use chat to request a patch.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Button onClick={()=>setShowFix(null)}>Cancel</Button>
              {showFix.patch && <Button className="bg-sky-600 hover:bg-sky-500 border-sky-500/30" onClick={()=>applyPatch(showFix)}>Confirm Fix</Button>}
            </div>
          </div>
        </div>
      )}

      {/* Chat drawer */}
      {chatOpen && (
        <div className="sheet">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-100"><Bot className="h-4 w-4 text-violet-400"/> Chat Review</div>
            <button onClick={()=>setChatOpen(false)} className="text-slate-400 hover:text-slate-200">Close</button>
          </div>
          <div className="grow scroll-y p-3 space-y-3">
            {messages.map((m,i)=>(
              <div key={i} className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm ${m.role==='assistant'?'border-white/10 bg-white/5':'ml-auto border-sky-500/20 bg-sky-500/10'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-3 flex items-center gap-2 border-t border-white/10">
            <input className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2" placeholder="Ask the agent…" onKeyDown={(e)=>{
              if(e.key==='Enter' && e.currentTarget.value.trim()){
                const t=e.currentTarget.value.trim(); e.currentTarget.value='';
                setMessages(m=>[...m,{role:'user',text:t}]);
                fetch(apiUrl('chat','/api/agent-chat'), {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: t })})
          .then(r=>r.json()).then(d=>setMessages(m=>[...m,{role:'assistant', text: d.reply }]))
          .catch(()=>setMessages(m=>[...m,{role:'assistant', text: 'Agent unavailable'}]));
              }
            }}/>
            <Button onClick={()=>setChatOpen(false)}><MessageSquare className="h-4 w-4"/> Send</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ title, code, tone }){
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
        <span>{title}</span>
      </div>
      <pre className={`p-3 text-[12.5px] leading-6 ${tone==='red'?'bg-red-500/5':tone==='emerald'?'bg-emerald-500/5':'bg-black/30'}`}>
        <code className="whitespace-pre-wrap text-slate-200">{code}</code>
      </pre>
    </div>
  );
}
