import config from '../../src/lib/config';
import { CommentSubmission } from '../../src/types/comments';

// Helper function to escape special characters for Telegram MarkdownV2
function escapeMarkdown(text: string): string {
  // Characters that need escaping in MarkdownV2: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export async function sendNewCommentNotification(
  comment: CommentSubmission,
  postId: string,
  botToken: string | null,
  chatId: string | null
): Promise<void> {
  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID not set');
    return;
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const postUrl = escapeMarkdown(`${config.site.url}/post/${postId}`);
  const senderName = escapeMarkdown(comment.senderName);
  const senderEmail = comment.senderEmail ? escapeMarkdown(comment.senderEmail) : '';
  const content = escapeMarkdown(comment.content);

  const message = `*New comment*
Post: ${postUrl}
Sender Name: \`${senderName}\`
Sender Email: \`${senderEmail}\`
Content:
\`\`\`\n${content}\n\`\`\``;

  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'MarkdownV2',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending Telegram notification:', response.statusText, errorText);
    }
  } catch (error) {
    console.error('Exception when sending Telegram notification:', error);
  }
}
