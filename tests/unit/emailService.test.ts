import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { sendUserCreatedEmail } from '../../src/services/emailService';
import { User } from '../../src/types/user';

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  SendEmailCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('sendUserCreatedEmail', () => {
  it('sends an email with the correct parameters', async () => {
    await sendUserCreatedEmail(mockUser);

    // Inspect the SES instance that was created when the module loaded
    const sesInstance = (SESClient as jest.Mock).mock.instances[0] as { send: jest.Mock };
    expect(sesInstance.send).toHaveBeenCalledTimes(1);
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Destination: { ToAddresses: [expect.any(String)] },
        Message: expect.objectContaining({
          Subject: expect.objectContaining({ Data: expect.stringContaining('John Doe') }),
        }),
      }),
    );
  });

  it('propagates SES errors to the caller', async () => {
    const sesInstance = (SESClient as jest.Mock).mock.instances[0] as { send: jest.Mock };
    sesInstance.send.mockRejectedValueOnce(new Error('SES unavailable'));

    await expect(sendUserCreatedEmail(mockUser)).rejects.toThrow('SES unavailable');
  });
});
