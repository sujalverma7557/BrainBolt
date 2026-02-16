'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Button, Badge, RadioGroup } from '@/components/ui';
import type { RadioOption } from '@/components/ui';
import {
  fetchNextQuestion,
  submitAnswer,
  ensureUserId,
} from '@/lib/api-client';
import { nanoid } from 'nanoid';

type Phase = 'loading' | 'question' | 'result' | 'error';

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; scoreDelta: number } | null>(null);
  const [rankScore, setRankScore] = useState<number | null>(null);
  const [rankStreak, setRankStreak] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setSelected(null);
    setResult(null);
    ensureUserId();
    try {
      const data = await fetchNextQuestion(sessionId || undefined);
      setStateVersion(data.stateVersion);
      setCurrentScore(data.currentScore);
      setCurrentStreak(data.currentStreak);
      setQuestionId(data.questionId);
      setDifficulty(data.difficulty);
      setPrompt(data.prompt);
      setChoices(data.choices);
      setPhase('question');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load question');
      setPhase('error');
    }
  }, [sessionId]);
  const effectiveSessionId = sessionId ?? '';

  useEffect(() => {
    setSessionId(nanoid());
  }, []);

  useEffect(() => {
    if (sessionId) loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when sessionId is first set
  }, [sessionId]);

  const handleSubmit = async () => {
    if (selected === null || questionId === null || !effectiveSessionId) return;
    setPhase('loading');
    setError(null);
    try {
      const res = await submitAnswer({
        sessionId: effectiveSessionId,
        questionId,
        answer: selected,
        stateVersion,
        answerIdempotencyKey: nanoid(),
      });
      setResult({ correct: res.correct, scoreDelta: res.scoreDelta });
      setCurrentScore(res.totalScore);
      setCurrentStreak(res.newStreak);
      setStateVersion(res.stateVersion);
      setDifficulty(res.newDifficulty);
      setRankScore(res.leaderboardRankScore);
      setRankStreak(res.leaderboardRankStreak);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
      setPhase('error');
    }
  };

  const options: RadioOption[] = choices.map((c, i) => ({ value: c, label: c }));

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 4rem)',
        padding: 'var(--spacing-6)',
        maxWidth: '36rem',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
          flexWrap: 'wrap',
          padding: 'var(--spacing-3) var(--spacing-4)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Badge variant="score">Score: {currentScore}</Badge>
        <Badge variant="streak">Streak: {currentStreak}</Badge>
        <Badge variant="default">Level {difficulty}</Badge>
      </div>

      {phase === 'loading' && (
        <Card variant="elevated" padding="lg">
          <CardContent
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-3)',
              minHeight: '8rem',
            }}
          >
            <span
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                animation: 'quizPulse 1s ease-in-out infinite',
              }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>Loading next question…</span>
          </CardContent>
        </Card>
      )}

      {phase === 'error' && (
        <Card variant="elevated" padding="lg">
          <CardHeader style={{ color: 'var(--color-error)' }}>Something went wrong</CardHeader>
          <CardContent style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-text-muted)' }}>{error}</CardContent>
          <Button onClick={loadNext}>Try again</Button>
        </Card>
      )}

      {phase === 'question' && (
        <Card
          variant="elevated"
          padding="lg"
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          <CardHeader>
            <span
              style={{
                display: 'inline-block',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Difficulty {difficulty}
            </span>
            <p
              style={{
                marginTop: 'var(--spacing-2)',
                fontWeight: 'var(--font-weight-normal)',
                fontSize: 'var(--text-lg)',
                lineHeight: 1.5,
              }}
            >
              {prompt}
            </p>
          </CardHeader>
          <CardContent>
            <RadioGroup
              name="choice"
              options={options}
              value={selected}
              onChange={setSelected}
              aria-label="Select your answer"
            />
            <div style={{ marginTop: 'var(--spacing-6)' }}>
              <Button
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={selected === null}
              >
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === 'result' && result && (
        <Card
          variant="elevated"
          padding="lg"
          style={{
            borderLeft: '4px solid var(--color-border)',
            borderLeftColor: result.correct ? 'var(--color-success)' : 'var(--color-error)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <CardHeader
            style={{
              color: result.correct ? 'var(--color-success)' : 'var(--color-error)',
              fontSize: 'var(--text-xl)',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            {result.correct ? 'Correct!' : 'Incorrect'}
          </CardHeader>
          <CardContent>
            {result.correct && (
              <p
                style={{
                  marginBottom: 'var(--spacing-3)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                }}
              >
                +{result.scoreDelta} points
              </p>
            )}
            {(rankScore != null || rankStreak != null) && (
              <p
                style={{
                  marginBottom: 'var(--spacing-4)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Your rank — Score: #{rankScore ?? '—'} · Streak: #{rankStreak ?? '—'}
              </p>
            )}
            <Button size="lg" fullWidth onClick={loadNext}>
              Next question
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
