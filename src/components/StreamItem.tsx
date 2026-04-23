import { useState } from 'react';

interface Props {
  date: string;
  title: string;
  href: string;
  readMin: number;
  words: number;
  frontmatterText: string;
  summary: string;
  fileName: string;
  initiallyOpen?: boolean;
}

export default function StreamItem({
  date,
  title,
  href,
  readMin,
  words,
  frontmatterText,
  summary,
  fileName,
  initiallyOpen = false,
}: Props) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <div className={`v6-stream-item${open ? ' open' : ''}`}>
      <div
        className="v6-stream-summary"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <span className="v6-stream-caret">{open ? '▾' : '▸'}</span>
        <span className="v6-stream-date">{date}</span>
        <span className="v6-stream-title">{title}</span>
        <span className="v6-stream-meta">
          {readMin} min · {words}w
        </span>
      </div>
      {open && (
        <div className="v6-stream-body">
          <pre className="v6-stream-fm">{frontmatterText}</pre>
          <p className="v6-stream-sum">{summary}</p>
          <div className="v6-stream-links">
            <a href={href}>cat {fileName} →</a>
            <span className="sep">·</span>
            <a href={href} className="secondary">
              share ↗
            </a>
            <span className="sep">·</span>
            <a href="/rss.xml" className="secondary">
              rss
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
