import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { getPool } from '../db/mysql';
import { listUsersQuerySchema } from '../schemas/userSchemas';
import { success, badRequest, internalError, errorResponse } from '../utils/response';
import { isAppError } from '../utils/errors';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const parsed = listUsersQuerySchema.safeParse(event.queryStringParameters ?? {});
    if (!parsed.success) {
      return badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);
    }

    const { limit, offset } = parsed.data;

    const pool = getPool();
    const repository = new UserRepository(pool);
    const service = new UserService(repository);

    const result = await service.listUsers(limit, offset);
    return success(result);
  } catch (err) {
    if (isAppError(err)) {
      return errorResponse(err.statusCode, err.message, err.details);
    }
    process.stderr.write(`[listUsers] Unexpected error: ${String(err)}\n`);
    return internalError();
  }
};
