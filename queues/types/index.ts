export type Message = {
  messageId: string;
  insertedOn: Date;
  expiresOn: Date;
  popReceipt: string;
  nextVisibleOn: Date;
  dequeueCount: number;
  messageText: string;
};
