import { useState, useRef } from 'react';
import { mapError } from '../utils/errorMapper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';
console.log('API URL:', API_URL);

export default function useReview() {
  const [status,   setStatus]   = useState('idle'); // idle | loading | done | error
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [failedAt, setFailedAt] = useState(null); // 'uploading'|'reading'|'reviewing'|'preparing'|null
  const lastInputRef = useRef(null);

  async function submit(fileOrText) {
    lastInputRef.current = fileOrText;
    setStatus('loading');
    setError('');
    setResult(null);
    setFailedAt(null);

    const file = typeof fileOrText === 'string'
      ? new File([fileOrText], 'pasted.md', { type: 'text/markdown' })
      : fileOrText;

    const formData = new FormData();
    formData.append('file', file);

    // Phase: upload — network errors land here
    let res;
    try {
      res = await fetch(`${API_URL}/api/review`, { method: 'POST', body: formData });
    } catch (err) {
      setFailedAt('uploading');
      setError(mapError({ err, context: 'review' }));
      setStatus('error');
      return;
    }

    // Phase: parse response body
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error('[useReview] non-JSON response (status', res.status + '):', rawText.slice(0, 300));
      setFailedAt(null);
      setError(mapError({ err, status: res.status, context: 'review' }));
      setStatus('error');
      return;
    }

    if (!res.ok) {
      console.error('[useReview] error response', res.status, '—', data?.error, '— failedAt:', data?.failedAt);
      setFailedAt(data?.failedAt ?? null);
      setError(mapError({ status: res.status, serverMessage: data?.error, context: 'review' }));
      setStatus('error');
      return;
    }

    setResult(data);
    setStatus('done');
  }

  function retry() {
    if (lastInputRef.current != null) submit(lastInputRef.current);
  }

  function reset() {
    setStatus('idle');
    setResult(null);
    setError('');
    setFailedAt(null);
    lastInputRef.current = null;
  }

  return { submit, retry, status, result, error, failedAt, reset };
}
