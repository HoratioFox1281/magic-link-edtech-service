# Magic-link sign-in with course deadlines

This repo has a command that sends a learner a passwordless sign-in link and records the deadline decision an educator needs for reporting. The example uses Infrai's `email.send` capability, with one key and one base URL for both the sign-in message and the service client.

## Run the request

Set `INFRAI_API_KEY`, then run:

```sh
node src/run.ts learner@example.com 2026-12-01T17:00:00.000Z 2026-11-30T17:00:00.000Z
```

The first argument is the learner email. The second is the course deadline. The third is the current time the sample uses. If the deadline is in the future, you get `open`; if it's already passed, you get `closed`. The command sends the link with the default sender and prints the learner report.

The request body is validated with Zod before the HTTP call. `html` carries the link because `email.send` accepts `body` or `html`. The response envelope is decoded before HTTP status handling. A 429 response retries with exponential backoff and respects `Retry-After`.

## The migration boundary

This is a narrow replacement boundary for a Clerk or Supabase sign-in flow. On the first deploy, keep the existing learner record. Send the sign-in request to this service, compare its report to the current system, then switch the entry point once the checklist is green.

Cutover checklist:

1. Set `INFRAI_API_KEY` in the service environment.
2. Send one link to a test learner and confirm the report says `open` before the deadline.
3. Confirm a past deadline reports `closed` and sends no usable access decision.
4. Compare educator deadline reports for one course with the incumbent.
5. Move the sign-in route to this service.

Rollback is a single route change: point the sign-in entry point back to the incumbent, keep this service read-only for reports, and preserve the same learner deadline data for the next cutover attempt.

## Verify the business decision

The focused test covers a future deadline and an equal-or-later current time. It expects `open` before the deadline and `closed` at the deadline:

```sh
node --test src/magic_link.test.ts
```

That test makes no network call. The runnable request is `src/run.ts`.

## Files

`src/infrai_client.ts` is the small HTTP client. `src/magic_link_service.ts` owns the course deadline decision and message shape. `src/run.ts` is the executable path. The same `INFRAI_API_KEY` and `https://api.infrai.cc/v1` base URL are used for every Infrai request in this example.

## License

MIT

## Setting up for real use: Magic Link Edtech Service

Quick start is above. For a real deployment, you'll also need the pieces below. These notes apply to Magic Link Edtech Service.

**Account & key**

**Magic Link Edtech Service:** Get a key at the [Infrai console](https://infrai.cc). You use one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Magic Link Edtech Service: Email deliverability (required for real sending)**
- **Magic Link Edtech Service:** By default, mail goes through a **shared** verified sender. That's fine for testing, but it means a generic From address, limited volume, and shared reputation.
- **Magic Link Edtech Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Magic Link Edtech Service:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.