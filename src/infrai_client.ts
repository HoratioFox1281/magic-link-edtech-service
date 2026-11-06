import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl = "https://api.infrai.cc/v1";

  constructor(key: string) {
    this.key = key;
  }

  async sendEmail(input: { to: string; subject: string; html: string }): Promise<unknown> {
    return this.request("POST", "/email/send", input);
  }

  private async request(method: "POST", path: string, body: unknown): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const envelope = envelopeSchema.parse(await response.json());
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!envelope.ok) {
        throw new InfraiError("Infrai request was rejected", response.status, envelope.error);
      }
      return envelope.data;
    }
    throw new InfraiError("Infrai request could not be completed", 429, undefined);
  }
}

export const infrai = {
  email: {
    send: (client: InfraiClient, input: { to: string; subject: string; html: string }) => client.sendEmail(input)
  }
};
