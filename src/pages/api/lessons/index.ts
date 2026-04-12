import type { APIRoute } from 'astro';
import { getLessons, createLesson } from '../../../lib/lessons';

export const GET: APIRoute = async () => {
  try {
    const lessons = await getLessons();
    return new Response(JSON.stringify(lessons), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { topic, date, audience } = await request.json();
    if (!topic || !date) {
      return new Response(JSON.stringify({ error: 'topic and date are required' }), { status: 400 });
    }
    const slug = await createLesson(topic, date, audience || 'Elders Quorum');
    return new Response(JSON.stringify({ slug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
