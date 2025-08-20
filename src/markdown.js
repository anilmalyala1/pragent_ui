export const allowedMarkdownElements = [
  'a',
  'b',
  'blockquote',
  'code',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6'
];

export function stripHtml() {
  return (tree) => {
    function traverse(node, index, parent) {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'html' && parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        return;
      }

      if (Array.isArray(node.children)) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          traverse(node.children[i], i, node);
        }
      }
    }

    traverse(tree, null, null);
  };
}

