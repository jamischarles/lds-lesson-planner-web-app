import matter from 'gray-matter';
import { STAGES, type Stage, type StageStatus, type LessonFrontmatter, type LessonSummary, type StageFile, getNextStage } from './types';
import { STAGE_SCAFFOLDS } from './scaffolds';
import { listDir, readFile, writeFile, lessonPath, lessonDirPath } from './github';

export function slugify(topic: string, date: string): string {
  const topicSlug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${date}-${topicSlug}`;
}

export async function getLessons(): Promise<LessonSummary[]> {
  // List all directories under lessons/
  const items = await listDir('lessons');
  const dirs = items.filter(i => i.type === 'dir');

  const lessons: LessonSummary[] = [];

  for (const dir of dirs) {
    const slug = dir.name;
    const stages: Record<Stage, StageStatus | null> = {
      broad: null, shape: null, outline: null, draft: null, final: null,
    };

    let topic = '';
    let date = '';
    let audience = '';
    let currentStage: Stage = 'broad';

    // List files in this lesson dir
    const files = await listDir(lessonDirPath(slug));
    const fileNames = new Set(files.map(f => f.name));

    for (const stage of STAGES) {
      if (fileNames.has(`${stage}.md`)) {
        const result = await readFile(lessonPath(slug, stage));
        if (result) {
          const { data } = matter(result.content);
          stages[stage] = (data.status as StageStatus) || 'wip';
          topic = data.topic || topic;
          date = data.date || date;
          audience = data.audience || audience;
          currentStage = stage;
        }
      }
    }

    if (topic) {
      lessons.push({ slug, topic, date, audience, currentStage, stages });
    }
  }

  lessons.sort((a, b) => b.date.localeCompare(a.date));
  return lessons;
}

export async function getStageContent(slug: string, stage: Stage): Promise<StageFile | null> {
  const result = await readFile(lessonPath(slug, stage));
  if (!result) return null;

  const { data, content } = matter(result.content);
  return {
    frontmatter: data as LessonFrontmatter,
    body: content,
  };
}

export async function writeStageContent(slug: string, stage: Stage, frontmatter: Partial<LessonFrontmatter>, body: string): Promise<void> {
  const filePath = lessonPath(slug, stage);

  // Read existing frontmatter if file exists
  let existing: Partial<LessonFrontmatter> = {};
  const result = await readFile(filePath);
  if (result) {
    const { data } = matter(result.content);
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
  await writeFile(filePath, content, `Update ${slug}/${stage}.md`);
}

export async function createLesson(topic: string, date: string, audience: string): Promise<string> {
  const slug = slugify(topic, date);
  const filePath = lessonPath(slug, 'broad');

  // Check if it already exists
  const existing = await readFile(filePath);
  if (existing) return slug;

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
  await writeFile(filePath, content, `Create lesson: ${topic}`);

  return slug;
}

export async function completeStage(slug: string, stage: Stage): Promise<Stage | null> {
  const filePath = lessonPath(slug, stage);

  // Read current stage
  const result = await readFile(filePath);
  if (!result) throw new Error(`Stage file not found: ${stage}`);

  const { data, content } = matter(result.content);
  data.status = 'complete';
  data.updated_at = new Date().toISOString();

  // Write completed stage
  await writeFile(filePath, matter.stringify(content, data), `Complete ${slug}/${stage}`);

  // Create next stage scaffold
  const next = getNextStage(stage);
  if (next) {
    const nextPath = lessonPath(slug, next);
    const nextExists = await readFile(nextPath);
    if (!nextExists) {
      const frontmatter: LessonFrontmatter = {
        stage: next,
        topic: data.topic,
        date: data.date,
        audience: data.audience,
        status: 'wip',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await writeFile(nextPath, matter.stringify(STAGE_SCAFFOLDS[next], frontmatter), `Scaffold ${slug}/${next}`);
    }
  }

  return next;
}

export async function getLessonMeta(slug: string): Promise<{ topic: string; date: string; audience: string; stages: Record<Stage, StageStatus | null>; currentStage: Stage } | null> {
  const files = await listDir(lessonDirPath(slug));
  if (files.length === 0) return null;

  const fileNames = new Set(files.map(f => f.name));
  const stages: Record<Stage, StageStatus | null> = {
    broad: null, shape: null, outline: null, draft: null, final: null,
  };

  let topic = '';
  let date = '';
  let audience = '';
  let currentStage: Stage = 'broad';

  for (const stage of STAGES) {
    if (fileNames.has(`${stage}.md`)) {
      const result = await readFile(lessonPath(slug, stage));
      if (result) {
        const { data } = matter(result.content);
        stages[stage] = (data.status as StageStatus) || 'wip';
        topic = data.topic || topic;
        date = data.date || date;
        audience = data.audience || audience;
        currentStage = stage;
      }
    }
  }

  if (!topic) return null;
  return { topic, date, audience, stages, currentStage };
}
