import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { User } from '../types/user';

const SENDER_EMAIL = process.env.SES_SENDER_EMAIL ?? '';
const NOTIFICATION_EMAIL = process.env.SES_NOTIFICATION_EMAIL ?? 'besta-test@mailinator.com';

export async function sendUserCreatedEmail(user: User): Promise<void> {
  const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

  const command = new SendEmailCommand({
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [NOTIFICATION_EMAIL],
    },
    Message: {
      Subject: {
        Data: `New user created: ${user.name}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: buildHtmlBody(user),
          Charset: 'UTF-8',
        },
        Text: {
          Data: buildTextBody(user),
          Charset: 'UTF-8',
        },
      },
    },
  });

  await ses.send(command);
}

function buildHtmlBody(user: User): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>New User Created</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><th>Field</th><th>Value</th></tr>
          <tr><td>ID</td><td>${user.id}</td></tr>
          <tr><td>Name</td><td>${user.name}</td></tr>
          <tr><td>Email</td><td>${user.email}</td></tr>
          <tr><td>Phone</td><td>${user.phone ?? 'N/A'}</td></tr>
          <tr><td>Role</td><td>${user.role}</td></tr>
          <tr><td>Created At</td><td>${user.createdAt}</td></tr>
        </table>
        <p>This is an automated notification from the Besta Users API.</p>
      </body>
    </html>
  `;
}

function buildTextBody(user: User): string {
  return [
    'New User Created',
    '----------------',
    `ID: ${user.id}`,
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Phone: ${user.phone ?? 'N/A'}`,
    `Role: ${user.role}`,
    `Created At: ${user.createdAt}`,
    '',
    'This is an automated notification from the Besta Users API.',
  ].join('\n');
}
