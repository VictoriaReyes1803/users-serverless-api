import { APIGatewayProxyResultV2 } from 'aws-lambda';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function success(body: unknown, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export function created(body: unknown): APIGatewayProxyResultV2 {
  return success(body, 201);
}

export function noContent(): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers,
    body: '',
  };
}

export function errorResponse(
  statusCode: number,
  message: string,
  details?: unknown,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      error: message,
      ...(details ? { details } : {}),
    }),
  };
}

export function badRequest(message: string, details?: unknown): APIGatewayProxyResultV2 {
  return errorResponse(400, message, details);
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResultV2 {
  return errorResponse(401, message);
}

export function notFound(message = 'Resource not found'): APIGatewayProxyResultV2 {
  return errorResponse(404, message);
}

export function internalError(message = 'Internal server error'): APIGatewayProxyResultV2 {
  return errorResponse(500, message);
}
