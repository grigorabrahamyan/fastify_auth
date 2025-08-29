import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { formatError } from '../utils/errors';
import { config } from '../config';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error for debugging
  request.log.error(error);

  // Format error response
  const formattedError = formatError(error);

  // Don't expose stack traces in production
  const response = {
    error: {
      statusCode: formattedError.statusCode,
      message: formattedError.message,
      code: formattedError.code,
      ...(config.NODE_ENV === 'development' && {
        details: formattedError.details,
        stack: error.stack,
      }),
    },
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  };

  // Set appropriate status code and send response
  reply.status(formattedError.statusCode).send(response);
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  const response = {
    error: {
      statusCode: 404,
      message: `Route ${request.method} ${request.url} not found`,
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  };

  reply.status(404).send(response);
} 