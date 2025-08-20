import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function Summary({ summary, loadingReview }) {
  return (
    <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3">
      {loadingReview ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-1/2 bg-white/10 rounded" />
          <div className="h-3 w-full bg-white/10 rounded" />
          <div className="h-3 w-3/4 bg-white/10 rounded" />
        </div>
      ) : (
        <div className="text-sm font-normal text-slate-300 leading-relaxed break-words prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{summary || 'Run AI review to see insights.'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

