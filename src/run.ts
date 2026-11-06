import { InfraiClient } from "./infrai_client.ts";
import { sendMagicLink } from "./magic_link_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) {
  throw new Error("Set INFRAI_API_KEY before running the request");
}

const [email, deadline, now = new Date().toISOString()] = process.argv.slice(2);
if (!email || !deadline) {
  throw new Error("Usage: node src/run.ts <email> <deadline> [now]");
}

const client = new InfraiClient(key);
const report = await sendMagicLink(client, {
  email,
  deadline,
  now,
  signInUrl: "https://course.example/sign-in"
});
console.log(JSON.stringify({ learner: report.email, deadline: report.deadline, status: report.status }, null, 2));
