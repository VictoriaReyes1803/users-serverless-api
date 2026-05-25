import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

export const TEST_USER_FILE = path.resolve(process.cwd(), '.integration-test-user.json');

export default async function globalSetup(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.integration') });

  const required = ['API_URL', 'COGNITO_CLIENT_ID', 'COGNITO_USER_POOL_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.integration.example to .env.integration and fill in the values.',
    );
  }

  const userPoolId = process.env.COGNITO_USER_POOL_ID!;
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const email = `integration-${Date.now()}@example.com`;
  const password = `IntTest_${Date.now()}!Aa`;

  const client = new CognitoIdentityProviderClient({ region });

  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      TemporaryPassword: `Temp_${Date.now()}!Bb`,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
    }),
  );

  // Set permanent password so the user is not in FORCE_CHANGE_PASSWORD state
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );

  fs.writeFileSync(TEST_USER_FILE, JSON.stringify({ email, password, userPoolId, region }));
  console.log(`\n[integration] Created Cognito test user: ${email}`);
}
