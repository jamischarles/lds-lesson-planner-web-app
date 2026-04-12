import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { STAGES, type Stage, type StageStatus, type LessonFrontmatter, type LessonSummary, type StageFile, getNextStage } from './types';
import { STAGE_SCAFFOLDS } from './scaffolds';

const LESSONS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'lessons')
  : path.join(process.cwd(), 'lessons');

function ensureLessonsDir() {
  if (!fs.existsSync(LESSONS_DIR)) {
    fs.mkdirSync(LESSONS_DIR, { recursive: true });
  }
}

export function slugify(topic: string, date: string): string {
  const topicSlug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${date}-${topicSlug}`;
}

export function getLessons(): LessonSummary[] {
  ensureLessonsDir();
  const dirs = fs.readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const lessons: LessonSummary[] = [];

  for (const slug of dirs) {
    const lessonDir = path.join(LESSONS_DIR, slug);
    const stages: Record<Stage, StageStatus | null> = {
      broad: null, shape: null, outline: null, draft: null, final: null,
    };

    let topic = '';
    let date = '';
    let audience = '';
    let currentStage: Stage = 'broad';

    for (const stage of STAGES) {
      const filePath = path.join(lessonDir, `${stage}.md`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(raw);
        stages[stage] = (data.status as StageStatus) || 'wip';
        topic = data.topic || topic;
        date = data.date || date;
        audience = data.audience || audience;
        currentStage = stage;
      }
    }

    if (topic) {
      lessons.push({ slug, topic, date, audience, currentStage, stages });
    }
  }

  lessons.sort((a, b) => b.date.localeCompare(a.date));
  return lessons;
}

export function getStageContent(slug: string, stage: Stage): StageFile | null {
  const filePath = path.join(LESSONS_DIR, slug, `${stage}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    frontmatter: data as LessonFrontmatter,
    body: content,
  };
}

export function writeStageContent(slug: string, stage: Stage, frontmatter: Partial<LessonFrontmatter>, body: string): void {
  const lessonDir = path.join(LESSONS_DIR, slug);
  if (!fs.existsSync(lessonDir)) {
    fs.mkdirSync(lessonDir, { recursive: true });
  }

  const filePath = path.join(lessonDir, `${stage}.md`);

  // Merge with existing frontmatter if file exists
  let existing: Partial<LessonFrontmatter> = {};
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    existing = data as Partial<LessonFrontmatter>;
  }

  const merged: LessonFrontmatter = {
    stage,
    topic: frontmatter.topic || existing.topic || '',
    date: frontmatter.date || existing.date || '',
    audience: frontmatter.audience || existing.audience || '',
    status: frontmatter.status || existing.status || 'wip',
    created_at: existing.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const content = matter.stringify(body, merged);
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function createLesson(topic: string, date: string, audience: string): string {
  ensureLessonsDir();
  const slug = slugify(topic, date);
  const lessonDir = path.join(LESSONS_DIR, slug);

  if (fs.existsSync(lessonDir)) {
    // If it already exists, just return the slug
    return slug;
  }

  fs.mkdirSync(lessonDir, { recursive: true });

  const frontmatter: LessonFrontmatter = {
    stage: 'broad',
    topic,
    date,
    audience,
    status: 'wip',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const content = matter.stringify(STAGE_SCAFFOLDS.broad, frontmatter);
  fs.writeFileSync(path.join(lessonDir, 'broad.md'), content, 'utf-8');

  return slug;
}

export function completeStage(slug: string, stage: Stage): Stage | null {
  const filePath = path.join(LESSONS_DIR, slug, `${stage}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Stage file not found: ${stage}`);
  }

  // Mark current stage as complete
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  data.status = 'complete';
  data.updated_at = new Date().toISOString();
  fs.writeFileSync(filePath, matter.stringify(content, data), 'utf-8');

  // Create next stage scaffold
  const next = getNextStage(stage);
  if (next) {
    const nextPath = path.join(LESSONS_DIR, slug, `${next}.md`);
    if (!fs.existsSync(nextPath)) {
      const frontmatter: LessonFrontmatter = {
        stage: next,
        topic: data.topic,
        date: data.date,
        audience: data.audience,
        status: 'wip',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(nextPath, matter.stringify(STAGE_SCAFFOLDS[next], frontmatter), 'utf-8');
    }
  }

  return next;
}

export function getLessonMeta(slug: string): { topic: string; date: string; audience: string; stages: Record<Stage, StageStatus | null>; currentStage: Stage } | null {
  const lessonDir = path.join(LESSONS_DIR, slug);
  if (!fs.existsSync(lessonDir)) return null;

  const stages: Record<Stage, StageStatus | null> = {
    broad: null, shape: null, outline: null, draft: null, final: null,
  };

  let topic = '';
  let date = '';
  let audience = '';
  let currentStage: Stage = 'broad';

  for (const stage of STAGES) {
    const filePath = path.join(lessonDir, `${stage}.md`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(raw);
      stages[stage] = (data.status as StageStatus) || 'wip';
      topic = data.topic || topic;
      date = data.date || date;
      audience = data.audience || audience;
      currentStage = stage;
    }
  }

  if (!topic) return null;
  return { topic, date, audience, stages, currentStage };
}
