import { useState, useEffect, useRef, useCallback } from 'react';
import type { Stage } from '../lib/types';

interface EditorTabProps {
  slug: string;
  stage: Stage;
  initialBody: string;
  isReadOnly: boolean;
  onBodyChange: (body: string) => void;
}

export default function EditorTab({ slug, stage, initialBody, isReadOnly, onBodyChange }: EditorTabProps) {
  const [body, setBody] = useState(initialBody);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when stage or initialBody changes
  useEffect(() => {
    setBody(initialBody);
    setSaveStatus('idle');
  }, [stage, initialBody]);

  const save = useCallback(async (content: string) => {
    setSaveStatus('saving');
    try {
      await fetch(`/api/lessons/${slug}/${stage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: content }),
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('idle');
    }
  }, [slug, stage]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);
    onBodyChange(val);

    if (isReadOnly) return;

    // Debounce save
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 500);
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Save indicator */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {stage}{isReadOnly ? ' (read-only)' : ''}
        </span>
        {!isReadOnly && (
          <span className="text-xs text-gray-400">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}
          </span>
        )}
      </div>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={handleChange}
        readOnly={isReadOnly}
        className="flex-1 w-full px-4 py-3 text-base leading-relaxed resize-none focus:outline-none bg-white font-mono"
        style={{ fontSize: '16px', minHeight: '200px' }}
        placeholder="Start writing..."
      />
    </div>
  );
}
