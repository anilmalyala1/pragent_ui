import React from 'react';
import { ChevronsUpDown, Hash, FileText, Bot, Wand2 } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function IssueViewer({
  loadingReview,
  severityFilter,
  setSeverityFilter,
  sortBySeverity,
  setSortBySeverity,
  visibleIssues,
  activeFile,
  setActiveFile,
  scrollToLine,
  expandedIssue,
  setExpandedIssue,
  setIssueIndex,
  setShowFix,
  severityTone,
}) {
  return (
    <>
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

                  <div className="text-xs font-normal text-slate-300 leading-relaxed break-words">
                    {issue.description}
                  </div>

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
                    {issue.file === activeFile && (
                      <span className="text-sky-400 text-[10px] px-1.5 py-0.5 bg-sky-500/20 rounded border border-sky-500/30">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

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
    </>
  );
}

