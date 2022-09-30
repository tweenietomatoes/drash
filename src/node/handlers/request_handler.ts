/**
 * Drash - A micro HTTP framework for JavaScript and TypeScript systems.
 * Copyright (C) 2022  Drash authors. The Drash authors are listed in the
 * AUTHORS file at <https://github.com/drashland/drash/AUTHORS>. This notice
 * applies to Drash version 3.X.X and any later version.
 *
 * This file is part of Drash. See <https://github.com/drashland/drash>.
 *
 * Drash is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * Drash is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Drash. If not, see <https://www.gnu.org/licenses/>.
 */

// Imports from /core/common
import { AbstractRequestHandler } from "../../core/handlers/abstract_request_handler.ts";
import { HttpError } from "../../core/http/errors.ts";
import { ResponseBuilder } from "../../core/http/response_builder.ts";
import { StatusCode } from "../../core/enums.ts";
import * as CoreTypes from "../../core/types.ts";

// Imports from /core/node
import { DrashRequest } from "../http/drash_request.ts";
import { ResourceHandler } from "./resource_handler.ts";
import * as NodeTypes from "../types.ts";

/**
 * This class handles the entire request-resource-response lifecycle. It is in
 * charge of (not limited to) passing an incoming request through the lifecycle,
 * filtering requests, running middleware on requests, and returning a response
 * from the resource that matches the request.
 */
export class RequestHandler extends AbstractRequestHandler {
  // FILE MARKER - METHODS - PUBLIC (EXPOSED) //////////////////////////////////

  /**
   * Take the request in the given context and match its URL to a resource
   * handler. When matched, the `context.resource_handler` is set. If the
   * request's URL does not match with any resource handler (that is, the
   * request's URL does not match with any `paths` property in any resource),
   * then a `404 Not Found` error is thrown.
   * @param context - See {@link CoreTypes.ContextForRequest}.
   */
  matchRequestToResourceHandler(
    context: CoreTypes.ContextForRequest,
  ): void {
    const requestUrl = context.request.url;

    // If the resource was cached, then return it. No need to look for it again.
    if (this.resource_handlers_cached[requestUrl]) {
      const handler = this.resource_handlers_cached[requestUrl];
      context.resource_handler = handler;
      (context.request as DrashRequest).resource_handler = handler;
      return;
    }

    const url = new URL(requestUrl);

    for (const resourceConstructorName in this.resource_handlers) {
      const resourceHandler = this.resource_handlers[resourceConstructorName];
      const patterns = resourceHandler
        .getOriginalUrlPatterns() as NodeTypes.ResourcePaths[];

      for (const pattern of patterns) {
        const matchArray = url.pathname.match(pattern.regex_path);

        // If the request URL and result matched, then we know this result that
        // we are currently parsing contains the resource we are looking for
        if (matchArray) {
          const handler = this.resource_handlers[resourceConstructorName];
          this.resource_handlers_cached[requestUrl] = handler;
          (context.request as DrashRequest).setResourceHandler(handler);
          context.resource_handler = handler;
          return;
        }
      }
    }

    throw new HttpError(StatusCode.NotFound);
  }

  /**
   * Each incoming request has its own context so as not to overlap with one
   * another. The context is created here.
   * @param incomingRequest - The request to create a context for before it is
   * processed through the chain.
   * @returns The context Drash needs to process the request end-to-end.
   */
  createContext(incomingRequest: Request): CoreTypes.ContextForRequest {
    const context: CoreTypes.ContextForRequest = {
      request: new DrashRequest(incomingRequest),
      response: new ResponseBuilder(),
    };

    return context;
  }

  addResourceHandler(ResourceClass: CoreTypes.ResourceClass): void {
    this.resource_handlers[ResourceClass.name] = new ResourceHandler(
      ResourceClass,
    );
  }
}
