const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre'];

// Strip tags not in allowlist; preserve content inside disallowed tags.
function sanitize(html: string): string {
  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
    return ALLOWED_TAGS.includes(tag.toLowerCase()) ? match : '';
  });
}

export default function Abstract({ html }: { html: string }) {
  return (
    <div
      style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-muted)' }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
