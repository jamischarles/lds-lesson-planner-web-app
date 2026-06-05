import type { APIRoute } from 'astro';
import { getStageContent, writeStageContent } from '../../../../../lib/lessons';
import { STAGES, type Stage } from '../../../../../lib/types';

export const GET: APIRoute = async ({ params }) => {
  const { slug, stage } = params;
  if (!slug || !stage || !STAGES.includes(stage as Stage)) {
    return new Response(JSON.stringify({ error: 'Invalid slug or stage' }), { status: 400 });
  }

  try {
    const content = await getStageContent(slug, stage as Stage);
    if (!content) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { slug, stage } = params;
  if (!slug || !stage || !STAGES.includes(stage as Stage)) {
    return new Response(JSON.stringify({ error: 'Invalid slug or stage' }), { status: 400 });
  }

  try {
    const { frontmatter, body } = await request.json();
    await writeStageContent(slug, stage as Stage, frontmatter || {}, body || '');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
