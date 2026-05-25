import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { getPool } from '../db/mysql';
import { uuidParamSchema } from '../schemas/userSchemas';
import { success, badRequest, internalError, errorResponse } from '../utils/response';
import { isAppError } from '../utils/errors';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const parsed = uuidParamSchema.safeParse(event.pathParameters);
    if (!parsed.success) {
      return badRequest('Invalid user id', parsed.error.flatten().fieldErrors);
    }

    const pool = await getPool();
    const repository = new UserRepository(pool);
    const service = new UserService(repository);

    const user = await service.getUserById(parsed.data.id);
    return success(user);
  } catch (err) {
    if (isAppError(err)) {
      return errorResponse(err.statusCode, err.message, err.details);
    }
    process.stderr.write(`[getUser] Unexpected error: ${String(err)}\n`);
    return internalError();
  }
};
