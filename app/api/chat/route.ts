import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export const runtime = 'edge';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response("Missing GROQ_API_KEY", { status: 500 });
    }

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [{ role: 'user', content: message }],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
