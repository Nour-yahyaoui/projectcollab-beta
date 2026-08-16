import Groq from "groq-sdk";
import { requireAuth } from "@/lib/auth";
import { ok, error, unauthorized, rateLimited } from "@/lib/apiResponse";
import { messageAiLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You improve short direct messages that one developer is sending to
another on a project-collaboration platform (e.g. reaching out about a project post, offering
to help, asking to collaborate). Rewrite the user's message to sound clear, professional, and
friendly, while keeping their original meaning, intent, and any facts they stated. Do not invent
claims, offers, or details they didn't mention. Keep it concise — a short paragraph at most.
Respond with ONLY the improved message text, no preamble, no quotes, no markdown.`;

export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const identifier = getClientIdentifier(request, user.id);
  const { success } = await messageAiLimiter(identifier);
  if (!success) return rateLimited("You can upgrade up to 20 messages per hour");

  const body = await request.json().catch(() => null);
  const text = body?.text?.trim();
  if (!text) return error("text is required", 400);
  if (text.length > 2000) return error("message is too long", 400);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const improved = completion.choices[0]?.message?.content?.trim();
    if (!improved) return error("AI did not return a result", 502);

    return ok({ original: text, improved });
  } catch (err) {
    console.error("Groq request failed:", err);
    return error("AI service is temporarily unavailable", 502);
  }
}
