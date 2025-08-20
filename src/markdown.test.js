import { stripHtml } from './markdown';

describe('stripHtml plugin', () => {
  it('removes script tags', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Hello' },
            { type: 'html', value: '<script>alert("xss")</script>' },
            { type: 'text', value: 'World' },
          ],
        },
      ],
    };
    stripHtml()(tree);
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Hello' },
            { type: 'text', value: 'World' },
          ],
        },
      ],
    });
  });

  it('removes img tags', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Look' },
            { type: 'html', value: '<img src=x onerror=alert(1)/>' },
          ],
        },
      ],
    };
    stripHtml()(tree);
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Look' }],
        },
      ],
    });
  });
});
