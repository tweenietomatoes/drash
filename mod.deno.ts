import { RequestHandler } from "././src/deno/handlers/request_handler.ts";
import * as Interfaces from "./src/core/interfaces.ts";
import * as Types from "./src/core/types.ts";

export * as Errors from "./src/core/http/errors.ts";
export { ErrorHandler } from "./src/core/handlers/error_handler.ts";
export { mimeDb as MimeDb } from "./src/core/dictionaries/mime_db.ts";
export {
  Method as HTTPMethod,
  StatusCode as HTTPStatusCode,
} from "./src/core/dictionaries/http.ts";
export { Resource } from "./src/core/http/resource.ts";

export type {
  DrashRequest as Request,
  DrashResponse as Response,
  RequestHandler,
} from "./src/core/interfaces.ts";

export type { Interfaces, Types };

/**
 * Create a request handler to route `Request` objects through.
 *
 * @param options See `Types.RequestHandlerOptions`.
 * @returns An instance of Drash's `RequestHandler`.
 */
export async function createRequestHandler(
  options?: Types.RequestHandlerOptions,
): Promise<Interfaces.RequestHandler> {
  const r = new RequestHandler(options);
  await r.runServicesAtStartup();
  return r;
}
