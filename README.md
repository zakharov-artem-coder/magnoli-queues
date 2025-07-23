# Magnoli queues

## Adding a new queue

1. Create a new TypeScript file in `queues/` named `<name>.queue.ts`.
   Implement a class that wraps an `@azure/storage-queue` client and provides at least the following members:

   - `queueClient: QueueClient` – connected to the Azure Storage queue.
   - `start(): Promise<void>` – an infinite loop that receives and dispatches messages.
   - `handleMessage(payload: Message): Promise<void>` – your business logic per message.
   - `delay(ms: number): Promise<void>` – helper for throttling / back-off.

2. Export a singleton instance at the bottom of the file:

   ```ts
   const myQueue = new MyQueue();
   export default myQueue;
   ```

3. Register the new queue in `queues/index.ts` so the worker knows about it:

   ```ts
   import invoicesQueue from "./invoices.queue";
   import myQueue from "./my.queue";

   export const queues = [invoicesQueue, myQueue];
   ```

4. Ensure required environment variables are present (e.g. `AZURE_STORAGE_CONNECTION_STRING`, custom API URLs, etc.).

## Running the worker

Start all registered queues concurrently:

```bash
npm run start:worker
```

The worker imports `queues/index.ts` and launches every queue via `Promise.all`, so any queue added to the array starts automatically.
