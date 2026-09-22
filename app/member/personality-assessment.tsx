"use client";
import { useEffect, useRef, useState } from 'react';
import { encodePersonality, parsePersonality, personalityAxes, personalityItems, personalityResult } from '../../lib/personality';

export function PersonalitySummary({ value }: { value: unknown }) {
  const result = personalityResult(value);
  if (!result) return null;
  return <section className="personality-result">
    <span>YOUR PERSONALITY PREFERENCES</span><h3>{result.type}</h3><p>{result.description}</p>
    {result.axes.map(axis => <div className="personality-axis" key={axis.name}>
      <div><span>{axis.letters[0]} · {axis.labels[0]} {axis.first}%</span><span>{axis.second}% {axis.labels[1]} · {axis.letters[1]}</span></div>
      <div className="personality-track"><i style={{ width: `${axis.first}%` }} /></div>
      {axis.balanced && <small>Balanced responses; your stated preference determines the letter.</small>}
    </div>)}
    <small>ABLE 16-type reflection. Independent of MBTI® and 16Personalities. A reflection of preferences, not a diagnosis or validated assessment.</small>
  </section>;
}

export function PersonalityAssessment({ value, onChange, onSave, saving }: {
  value: unknown; onChange: (value: string) => void; onSave: (value: string) => Promise<void>; saving: boolean;
}) {
  const answers = parsePersonality(value);
  const [page, setPage] = useState(() => {
    const first = personalityItems.findIndex(item => !answers[item.key]);
    return first === -1 ? 12 : Math.floor(first / 4);
  });
  const [error, setError] = useState('');
  const assessmentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { assessmentRef.current?.closest('main')?.scrollTo({ top: 0 }); }, [page]);
  const questions = personalityItems.slice(page * 4, page * 4 + 4);
  const complete = Object.keys(answers).length;
  const pageReady = page === 12 ? personalityAxes.every((_, i) => answers[`tie${i}`]) : questions.every(item => answers[item.key]);
  const labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  async function move(next: number) {
    setError('');
    try { await onSave(encodePersonality(answers)); setPage(next); } catch { setError('Could not save. Your answers are still here. Please try again.'); }
  }
  return <div className="personality-assessment" ref={assessmentRef}>
    <div className="personality-progress"><span>{complete} of 52 answered</span><span>{page < 12 ? personalityAxes[Math.floor(page / 3)].name : 'Your preferences'}</span></div>
    <progress max={52} value={complete} aria-label="Personality assessment progress" />
    {page === 0 && <p className="personality-caption">Answer for your usual self. About 8 minutes.</p>}
    {page === 12 && <h3 className="personality-caption">Which feels closer to you?</h3>}
    {page < 12 ? questions.map(item => <fieldset key={item.key} disabled={saving}>
      <legend>{item.prompt}</legend>
      <div className="personality-choices">{labels.map((label, i) => <label key={label} className={answers[item.key] === i + 1 ? 'selected' : ''}>
        <input type="radio" name={item.key} value={i + 1} checked={answers[item.key] === i + 1} onChange={() => onChange(encodePersonality({ ...answers, [item.key]: i + 1 }))} /><span>{label}</span>
      </label>)}</div>
    </fieldset>) : personalityAxes.map((axis, index) => <fieldset key={axis.name} disabled={saving}>
      <legend>{axis.name}</legend>
      <div className="personality-preferences">{axis.labels.map((label, i) => <label key={label} className={answers[`tie${index}`] === i + 1 ? 'selected' : ''}>
        <input type="radio" name={`tie${index}`} checked={answers[`tie${index}`] === i + 1} onChange={() => onChange(encodePersonality({ ...answers, [`tie${index}`]: i + 1 }))} />{label}
      </label>)}</div>
    </fieldset>)}
    {error && <p role="alert">{error}</p>}
    <div className="personality-pagination">
      <button type="button" disabled={saving || page === 0} onClick={() => void move(page - 1)}>Back</button>
      <span>{page + 1} / 13</span>
      {page < 12 && <button type="button" disabled={saving || !pageReady} onClick={() => void move(page + 1)}>{saving ? 'Saving...' : 'Continue'}</button>}
    </div>
    {page === 12 && <PersonalitySummary value={value} />}
  </div>;
}
