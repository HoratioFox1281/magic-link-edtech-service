import { z } from "zod";
import { InfraiClient, infrai } from "./infrai_client.ts";

export const signInRequestSchema = z.object({
  email: z.string().email(),
  deadline: z.string().datetime(),
  now: z.string().datetime(),
  signInUrl: z.string().url()
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;
export type LearnerReport = SignInRequest & { status: "open" | "closed" };

export function deadlineStatus(deadline: string, now: string): "open" | "closed" {
  return Date.parse(now) < Date.parse(deadline) ? "open" : "closed";
}

export async function sendMagicLink(client: InfraiClient, raw: unknown): Promise<LearnerReport> {
  const input = signInRequestSchema.parse(raw);
  const status = deadlineStatus(input.deadline, input.now);
  await infrai.email.send(client, {
    to: input.email,
    subject: "Your course sign-in link",
    html: `<p>Sign in to your course:</p><p><a href="${input.signInUrl}">Open course</a></p>`
  });
  return { ...input, status };
}
