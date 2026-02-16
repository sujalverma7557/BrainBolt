import {
  pgTable,
  serial,
  varchar,
  integer,
  bigint,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questions = pgTable(
  'questions',
  {
    id: serial('id').primaryKey(),
    difficulty: integer('difficulty').notNull(),
    prompt: varchar('prompt', { length: 1024 }).notNull(),
    choices: jsonb('choices').$type<string[]>().notNull(),
    correctAnswerHash: varchar('correct_answer_hash', { length: 64 }).notNull(),
    tags: jsonb('tags').$type<string[]>(),
  },
  (t) => [index('questions_difficulty_idx').on(t.difficulty)]
);

export const userState = pgTable('user_state', {
  userId: varchar('user_id', { length: 64 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currentDifficulty: integer('current_difficulty').notNull().default(1),
  streak: integer('streak').notNull().default(0),
  maxStreak: integer('max_streak').notNull().default(0),
  totalScore: bigint('total_score', { mode: 'number' }).notNull().default(0),
  lastQuestionId: integer('last_question_id').references(() => questions.id),
  lastAnswerAt: timestamp('last_answer_at', { withTimezone: true }),
  stateVersion: integer('state_version').notNull().default(0),
  sessionId: varchar('session_id', { length: 64 }),
});

export const answerLog = pgTable(
  'answer_log',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    questionId: integer('question_id').notNull().references(() => questions.id),
    difficulty: integer('difficulty').notNull(),
    answer: varchar('answer', { length: 512 }).notNull(),
    correct: integer('correct').notNull(), // 1 or 0 for boolean
    scoreDelta: integer('score_delta').notNull().default(0),
    streakAtAnswer: integer('streak_at_answer').notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 64 }),
  },
  (t) => [
    uniqueIndex('answer_log_idempotency').on(t.idempotencyKey),
    index('answer_log_user_answered_idx').on(t.userId, t.answeredAt),
  ]
);

export const leaderboardScore = pgTable(
  'leaderboard_score',
  {
    userId: varchar('user_id', { length: 64 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    totalScore: bigint('total_score', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('leaderboard_score_total_score_idx').on(t.totalScore)]
);

export const leaderboardStreak = pgTable(
  'leaderboard_streak',
  {
    userId: varchar('user_id', { length: 64 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    maxStreak: integer('max_streak').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('leaderboard_streak_max_streak_idx').on(t.maxStreak)]
);

export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserState = typeof userState.$inferSelect;
export type AnswerLog = typeof answerLog.$inferSelect;
export type LeaderboardScore = typeof leaderboardScore.$inferSelect;
export type LeaderboardStreak = typeof leaderboardStreak.$inferSelect;
