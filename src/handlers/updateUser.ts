import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { getPool } from '../db/mysql';
import { updateUserSchema, uuidParamSchema } from '../schemas/userSchemas';
import { success, badRequest, internalError, errorResponse } from '../utils/response';
import { isAppError } from '../utils/errors';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const paramsParsed = uuidParamSchema.safeParse(event.pathParameters);
    if (!paramsParsed.success) {
      return badRequest('Invalid user id', paramsParsed.error.flatten().fieldErrors);
    }

    const body = JSON.parse(event.body ?? '{}');
    const bodyParsed = updateUserSchema.safeParse(body);
    if (!bodyParsed.success) {
      return badRequest('Validation failed', bodyParsed.error.flatten().fieldErrors);
    }

    const pool = await getPool();
    const repository = new UserRepository(pool);
    const service = new UserService(repository);

    const user = await service.updateUser(paramsParsed.data.id, bodyParsed.data);
    return success(user);
  } catch (err) {
    if (isAppError(err)) {
      return errorResponse(err.statusCode, err.message, err.details);
    }
    process.stderr.write(`[updateUser] Unexpected error: ${String(err)}\n`);
    return internalError();
  }
};
