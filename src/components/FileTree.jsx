import React, { useState } from 'react';
import { ChevronRight, FileText } from 'lucide-react';

// Build a nested object representing the file hierarchy
export const buildFileTree = files => {
  const tree = {};
  files.forEach(file => {
    const parts = file.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (!current[part]) {
        current[part] = {
          type: i === parts.length - 1 ? 'file' : 'folder',
          path: file,
          children: {},
        };
      }
      current = current[part].children;
    });
  });
  return tree;
};

// Recursively render a collapsible file tree
export default function FileTree({ tree, onFileClick, activeFile }) {
  const [openFolders, setOpenFolders] = useState({});

  const toggleFolder = path => {
    setOpenFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (node, path = '', level = 0) => {
    return Object.entries(node).map(([name, item]) => {
      const currentPath = path ? `${path}/${name}` : name;
      if (item.type === 'folder') {
        return (
          <div key={currentPath} className="text-sm">
            <button
              onClick={() => toggleFolder(currentPath)}
              className="w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-700 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
            >
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${openFolders[currentPath] ? 'rotate-90' : ''}`}
                style={{ marginLeft: `${level * 12}px` }}
              />
              <span className="truncate">{name}</span>
            </button>
            {openFolders[currentPath] && (
              <div>{renderTree(item.children, currentPath, level + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <button
          key={currentPath}
          onClick={() => onFileClick(item.path)}
            className={`w-full text-left flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs truncate transition-colors ${
              activeFile === item.path
                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-200'
                : 'text-slate-700 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5'
            }`}
          title={item.path}
          style={{ paddingLeft: `${level * 12 + 16}px` }}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{name}</span>
        </button>
      );
    });
  };

  return <div>{renderTree(tree)}</div>;
}

