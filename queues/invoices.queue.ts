import { QueueClient, QueueServiceClient } from "@azure/storage-queue";
import { Message } from "./types";

interface Queue {
  queueClient: QueueClient;

  start(): Promise<void>;
  handleMessage(payload: Message): Promise<void>;
  delay(ms: number): Promise<void>;
}

export class InvoiceQueue implements Queue {
  public readonly queueClient: QueueClient;

  constructor(
    private readonly name = "invoices",
    private readonly connectionString = process.env
      .AZURE_STORAGE_CONNECTION_STRING!
  ) {
    this.queueClient =
      QueueServiceClient.fromConnectionString(connectionString).getQueueClient(
        name
      );
  }

  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async handleMessage(payload: Message): Promise<void> {
    try {
      console.log(
        `[${this.name}] 📦 Handling message: ${JSON.stringify(
          payload,
          null,
          2
        )}`
      );
      // Decode the Base64‐encoded message before forwarding it to the API
      const decodedMessage = Buffer.from(
        payload.messageText,
        "base64"
      ).toString("utf-8");

      const res = await fetch(`${process.env.HQ_API_URL}/rules/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: decodedMessage,
      }).then((res) => res.json());

      if (res.success) {
        await this.queueClient.deleteMessage(
          payload.messageId,
          payload.popReceipt
        );
      }
    } catch (error) {
      console.error(
        `[${this.name}] 📦 Error handling message: ${JSON.stringify(
          error,
          null,
          2
        )}`
      );
    } finally {
      await this.delay(1000);
    }
  }

  async start(): Promise<void> {
    console.log(`[${this.name}] 📦 Starting queue`);
    while (true) {
      const messages = await this.queueClient.receiveMessages();
      if (messages.receivedMessageItems.length === 0) {
        console.log(
          `[${
            this.name
          }] ${new Date().toISOString()} 📦 No messages found, waiting 5 seconds`
        );
        await this.delay(5000);
        continue;
      }

      const promises = messages.receivedMessageItems.map((message) =>
        this.handleMessage(message)
      );

      await Promise.all(promises);
    }
  }
}

const invoicesQueue = new InvoiceQueue();
export default invoicesQueue;
