import sanitizeHtml from 'sanitize-html';

interface AbstractProps {
  html: string;
}

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre'];
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'rel', 'target'],
};

export function Abstract({ html }: AbstractProps) {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    transformTags: {
      a: (_tag, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'nofollow noopener',
          target: '_blank',
        },
      }),
    },
  });

  return (
    <div
      style={{
        fontSize: 14.5,
        lineHeight: 1.5,
        color: 'var(--color-text)',
      }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
