import * as fs from 'fs';
import * as path from 'path';
import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const TEST_USER_FILE = path.resolve(process.cwd(), '.integration-test-user.json');

let cachedToken: string | null = null;

export async function getIdToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const { email, password, region } = JSON.parse(fs.readFileSync(TEST_USER_FILE, 'utf-8')) as {
    email: string;
    password: string;
    region: string;
  };

  const client = new CognitoIdentityProviderClient({ region });

  const response = await client.send(
    new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );

  const token = response.AuthenticationResult?.IdToken;
  if (!token) throw new Error('Cognito authentication failed — no IdToken returned');

  cachedToken = token;
  return token;
}
