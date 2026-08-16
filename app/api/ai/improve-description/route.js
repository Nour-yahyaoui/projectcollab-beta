import Groq from "groq-sdk";
import { requireAuth } from "@/lib/auth";
import { ok, error, unauthorized, rateLimited } from "@/lib/apiResponse";
import { aiLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You improve short project descriptions written by developers on a
project-collaboration platform. Rewrite the user's description to be clearer, more
professional, and more engaging, while keeping their original meaning and any technical
facts they stated. Do not invent features, technologies, or claims they didn't mention.
Keep it to 2-4 sentences. Respond with ONLY the improved description text, no preamble,
no quotes, no markdown.`;

export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const identifier = getClientIdentifier(request, user.id);
  const { success } = await aiLimiter(identifier);
  if (!success) return rateLimited("You can improve up to 20 descriptions per hour");

  const body = await request.json().catch(() => null);
  const description = body?.description?.trim();
  if (!description) return error("description is required", 400);
  if (description.length > 2000) return error("description is too long", 400);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const improved = completion.choices[0]?.message?.content?.trim();
    if (!improved) return error("AI did not return a result", 502);

    return ok({ original: description, improved });
  } catch (err) {
    console.error("Groq request failed:", err);
    return error("AI service is temporarily unavailable", 502);
  }
}
