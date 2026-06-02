export interface INotificationSender {
  sendMessage(chatId: string, text: string): Promise<void>;
}
