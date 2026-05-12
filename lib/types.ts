export type GoalKind = 'lose_weight' | 'gain_weight' | 'other';

export type Profile = {
  id: number;
  displayName: string;
  heightCm: number | null;
  weightKg: number | null;
  notes: string | null;
  updatedAt: string;
};

export type Goal = {
  id: number;
  kind: GoalKind;
  title: string;
  targetValue: number | null;
  unit: string | null;
  deadline: string | null;
  createdAt: string;
};

export type WorkoutTemplate = {
  id: number;
  name: string;
  createdAt: string;
};

export type TemplateExercise = {
  id: number;
  templateId: number;
  name: string;
  sortOrder: number;
  notes: string | null;
  setsCount: number | null;
  reps: string | null;
};

export type SessionRow = {
  id: number;
  templateId: number | null;
  title: string | null;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt: string | null;
};

export type SessionExercise = {
  id: number;
  sessionId: number;
  name: string;
  sortOrder: number;
};

export type SetRow = {
  id: number;
  exerciseId: number;
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
};

export type ProgressWeek = {
  weekStart: string;
  sessionCount: number;
  volumeKg: number;
};

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: number;
  role: ChatRole;
  content: string;
  createdAt: string;
};
