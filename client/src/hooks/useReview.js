import { useState } from 'react';
import { mapError } from '../utils/errorMapper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';
console.log('API URL:', API_URL);

export default function useReview() {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  async function submit(fileOrText) {
    setStatus('loading');
    setError('');
    setResult(null);

    const file = typeof fileOrText === 'string'
      ? new File([fileOrText], 'pasted.md', { type: 'text/markdown' })
      : fileOrText;

    const formData = new FormData();
    formData.append('file', file);

    // 1. Attempt the fetch — isolate network errors
    let res;
    try {
      res = await fetch(`${API_URL}/api/review`, { method: 'POST', body: formData });
    } catch (err) {
      setError(mapError({ err, context: 'review' }));
      setStatus('error');
      return;
    }

    // 2. Parse response body — isolate JSON errors
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error('[useReview] non-JSON response (status', res.status + '):', rawText.slice(0, 300));
      setError(mapError({ err, status: res.status, context: 'review' }));
      setStatus('error');
      return;
    }

    // 3. Non-2xx — map server error to friendly message
    if (!res.ok) {
      console.error('[useReview] error response', res.status, '—', data?.error);
      setError(mapError({ status: res.status, serverMessage: data?.error, context: 'review' }));
      setStatus('error');
      return;
    }

    setResult(data);
    setStatus('done');
  }

  function reset() {
    setStatus('idle');
    setResult(null);
    setError('');
  }

  return { submit, status, result, error, reset };
}
