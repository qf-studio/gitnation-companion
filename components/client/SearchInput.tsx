'use client';

import { useEffect, useRef, useState } from 'react';

interface SearchInputProps {
  defaultValue: string;
  /** Called on every keystroke with the new query (post-state update). */
  onQueryChange: (q: string) => void;
}

export function SearchInput({ defaultValue, onQueryChange }: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function commit(next: string) {
    setValue(next);
    onQueryChange(next);
    const target = next.length === 0 ? '/search' : `/search?q=${encodeURIComponent(next)}`;
    window.history.replaceState(null, '', target);
  }

  return (
    <div
      style={{
        position: 'relative',
        margin: '0 16px 12px',
      }}
    >
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(e) => commit(e.target.value)}
        placeholder="Search talks, speakers, tags"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          width: '100%',
          height: 44,
          padding: '0 40px 0 16px',
          fontSize: 15,
          fontWeight: 500,
          color: 'var(--color-text)',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border-2)',
          borderRadius: 12,
          outline: 'none',
          appearance: 'none',
        }}
      />
      {value.length > 0 ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            commit('');
            inputRef.current?.focus();
          }}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 24,
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
