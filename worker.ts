import "dotenv/config";
import { queues } from "./queues";

async function main() {
  await Promise.all(queues.map((queue) => queue.start()));
}

main().catch((err) => {
  console.error("❌ Worker crashed:", err);
  process.exit(1);
});
