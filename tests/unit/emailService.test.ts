import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { sendUserCreatedEmail } from '../../src/services/emailService';
import { User } from '../../src/types/user';

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(),
  SendEmailCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user',
  age: 16,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('sendUserCreatedEmail', () => {
  const mockSend = jest.fn();

  beforeEach(() => {
    // Re-apply after resetMocks clears implementations
    (SESClient as jest.Mock).mockImplementation(() => ({ send: mockSend }));
    jest.mocked(SendEmailCommand).mockImplementation((input) => ({ input }) as never);
    mockSend.mockResolvedValue({});
  });

  it('sends an email with the correct destination and subject', async () => {
    await sendUserCreatedEmail(mockUser);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Destination: { ToAddresses: [expect.any(String)] },
        Message: expect.objectContaining({
          Subject: expect.objectContaining({ Data: expect.stringContaining('John Doe') }),
        }),
      }),
    );
  });

  it('uses N/A for missing phone in both email bodies', async () => {
    await sendUserCreatedEmail({ ...mockUser, phone: null });

    const commandInput = (SendEmailCommand as unknown as jest.Mock).mock.calls[0][0];
    expect(commandInput.Message.Body.Html.Data).toContain('N/A');
    expect(commandInput.Message.Body.Text.Data).toContain('N/A');
  });

  it('propagates SES errors to the caller', async () => {
    mockSend.mockRejectedValueOnce(new Error('SES unavailable'));
    await expect(sendUserCreatedEmail(mockUser)).rejects.toThrow('SES unavailable');
  });
});
