import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { getPool } from '../db/mysql';
import { createUserSchema } from '../schemas/userSchemas';
import { created, badRequest, internalError, errorResponse } from '../utils/response';
import { isAppError } from '../utils/errors';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}');

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const pool = getPool();
    const repository = new UserRepository(pool);
    const service = new UserService(repository);

    const user = await service.createUser(parsed.data);
    return created(user);
  } catch (err) {
    if (isAppError(err)) {
      return errorResponse(err.statusCode, err.message, err.details);
    }
    process.stderr.write(`[createUser] Unexpected error: ${String(err)}\n`);
    return internalError();
  }
};
