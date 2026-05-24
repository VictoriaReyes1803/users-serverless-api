# besta-users-serverless-api — CLAUDE.md

## Project overview

AWS Serverless REST API for user management. Node.js 20 + TypeScript, Lambda functions, API Gateway HTTP API, RDS MySQL, Cognito JWT auth, SES email notifications. Infrastructure managed with Terraform.

## Architecture

- **Handlers** (`src/handlers/`) — one Lambda per route; parse/validate input, delegate to service
- **Services** (`src/services/`) — business logic; `userService` orchestrates repository + email
- **Repository** (`src/repositories/`) — all SQL in `userRepository`; returns domain objects
- **DB** (`src/db/mysql.ts`) — singleton connection pool; reused across warm Lambda invocations
- **Schemas** (`src/schemas/`) — Zod schemas; single source of truth for validation + types
- **Utils** — `response.ts` for uniform JSON responses, `errors.ts` for typed error hierarchy

## Key patterns

- Handlers instantiate dependencies directly (no DI container); testable via jest mocks on `getPool`
- Email notification is fire-and-forget (`sendUserCreatedEmail` called with `.catch()`); errors go to stderr, not to the caller
- `ConflictError` / `NotFoundError` / `ValidationError` inherit `AppError`; handlers catch `isAppError` and map `statusCode`
- All DB column names are `snake_case`; mapped to `camelCase` in `mapRowToUser`

## Dev commands

```bash
npm install          # install all deps
npm test             # run Jest with coverage
npm run build        # tsc → dist/
npm run lint         # ESLint
npm run format       # Prettier write
npm run package      # build + zip → function.zip
npm run deploy       # cd infra && terraform apply
npm run destroy      # cd infra && terraform destroy
```

## Terraform variables (required)

| Variable | Description |
|---|---|
| `db_password` | RDS master password |
| `ses_sender_email` | Verified SES sender (must be verified in AWS) |

Create `infra/terraform.tfvars` (git-ignored):

```hcl
db_password      = "YourSecurePassword123"
ses_sender_email = "no-reply@yourdomain.com"
```

## Testing approach

Unit tests mock the DB pool via `jest.mock('../../src/db/mysql')` and mock `mysql2/promise`. Handler tests mock both the pool and `emailService`. No real DB or AWS credentials needed to run tests.

## SES sandbox note

In SES sandbox mode both sender AND recipient must be verified. Mailinator addresses cannot be verified as SES identities. To test delivery to `besta-test@mailinator.com` you must request SES production access (sending limits increase). See README for steps.

## Migrations

Run `migrations/001_create_users_table.sql` against the RDS instance once after provisioning. Use a bastion or AWS Systems Manager Session Manager to reach the private RDS endpoint.
