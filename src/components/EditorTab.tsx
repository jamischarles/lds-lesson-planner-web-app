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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'idle'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef(body);
  const lastSavedRef = useRef(initialBody);
  const savingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep bodyRef in sync
  bodyRef.current = body;

  // Sync when stage or initialBody changes
  useEffect(() => {
    setBody(initialBody);
    lastSavedRef.current = initialBody;
    setSaveStatus('idle');
  }, [stage, initialBody]);

  const save = useCallback(async (content: string) => {
    // Skip if content hasn't changed since last save
    if (content === lastSavedRef.current) return;
    if (savingRef.current) return;

    savingRef.current = true;
    setSaveStatus('saving');
    try {
      await fetch(`/api/lessons/${slug}/${stage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: content }),
      });
      lastSavedRef.current = content;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    } finally {
      savingRef.current = false;
    }
  }, [slug, stage]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);
    onBodyChange(val);

    if (isReadOnly) return;

    setSaveStatus('unsaved');

    // Debounce save at 10 seconds (GitHub API writes are commits, so batch them)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 10_000);
  };

  // Save on blur (user taps away from textarea)
  const handleBlur = useCallback(() => {
    if (isReadOnly) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    save(bodyRef.current);
  }, [isReadOnly, save]);

  // Save on page visibility change (user switches apps on phone)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !isReadOnly) {
        if (timerRef.current) clearTimeout(timerRef.current);
        save(bodyRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isReadOnly, save]);

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
          <span className={`text-xs ${saveStatus === 'unsaved' ? 'text-yellow-600' : 'text-gray-400'}`}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'unsaved' ? 'Unsaved' : ''}
          </span>
        )}
      </div>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={isReadOnly}
        className="flex-1 w-full px-4 py-3 text-base leading-relaxed resize-none focus:outline-none bg-white font-mono"
        style={{ fontSize: '16px', minHeight: '200px' }}
        placeholder="Start writing..."
      />
    </div>
  );
}
