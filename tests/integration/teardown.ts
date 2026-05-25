import * as fs from 'fs';
import * as path from 'path';
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const TEST_USER_FILE = path.resolve(process.cwd(), '.integration-test-user.json');

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(TEST_USER_FILE)) return;

  const { email, userPoolId, region } = JSON.parse(fs.readFileSync(TEST_USER_FILE, 'utf-8')) as {
    email: string;
    userPoolId: string;
    region: string;
  };

  const client = new CognitoIdentityProviderClient({ region });

  try {
    await client.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: email }));
    console.log(`\n[integration] Deleted Cognito test user: ${email}`);
  } finally {
    fs.unlinkSync(TEST_USER_FILE);
  }
}
