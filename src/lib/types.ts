export const STAGES = ['broad', 'shape', 'outline', 'draft', 'final'] as const;
export type Stage = (typeof STAGES)[number];
export type StageStatus = 'wip' | 'complete';

export const STAGE_LABELS: Record<Stage, string> = {
  broad: 'Broad',
  shape: 'Shape',
  outline: 'Outline',
  draft: 'Draft',
  final: 'Final',
};

export const STAGE_PURPOSES: Record<Stage, string> = {
  broad: 'Define the sandbox',
  shape: 'Brainstorm within the sandbox',
  outline: 'Structure it',
  draft: 'Flesh it out',
  final: 'Lock it',
};

export interface LessonFrontmatter {
  stage: Stage;
  topic: string;
  date: string;
  audience: string;
  status: StageStatus;
  created_at: string;
  updated_at: string;
}

export interface LessonSummary {
  slug: string;
  topic: string;
  date: string;
  audience: string;
  currentStage: Stage;
  stages: Record<Stage, StageStatus | null>;
}

export interface StageFile {
  frontmatter: LessonFrontmatter;
  body: string;
}

export function getNextStage(stage: Stage): Stage | null {
  const idx = STAGES.indexOf(stage);
  return idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
}

export function getPreviousStage(stage: Stage): Stage | null {
  const idx = STAGES.indexOf(stage);
  return idx > 0 ? STAGES[idx - 1] : null;
}

export function getStageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}
