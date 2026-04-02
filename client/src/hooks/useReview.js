import { useState } from 'react';

export default function useReview() {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function submit(fileOrText) {
    setStatus('loading');
    setError('');
    setResult(null);

    const file = typeof fileOrText === 'string'
      ? new File([fileOrText], 'pasted.md', { type: 'text/markdown' })
      : fileOrText;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setResult(data);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setResult(null);
    setError('');
  }

  return { submit, status, result, error, reset };
}
