import type { APIRoute } from 'astro';
import { completeStage } from '../../../../../lib/lessons';
import { STAGES, type Stage } from '../../../../../lib/types';

export const POST: APIRoute = async ({ params }) => {
  const { slug, stage } = params;
  if (!slug || !stage || !STAGES.includes(stage as Stage)) {
    return new Response(JSON.stringify({ error: 'Invalid slug or stage' }), { status: 400 });
  }

  try {
    const nextStage = await completeStage(slug, stage as Stage);
    return new Response(JSON.stringify({ nextStage }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
