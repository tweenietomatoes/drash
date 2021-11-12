import { Types, Errors, Interfaces, Request, Resource, Response, Service } from "../../../mod.ts";
import { vary } from "./deps.ts";

type TOrigin = string | RegExp;
type TAllowMethod = "GET" | "HEAD" | "PUT" | "PATCH" | "POST" | "DELETE";

/**
 * Options that the user defines.
 */
interface IConstructorOptions {
  allowCredentials?: true;
  allowHeaders?: string[];
  allowMethods?: TAllowMethod[];
  allowOrigin?: TOrigin[];
  exposeHeaders?: string;
  maxAge?: number;
  preflight?: boolean;
};

/**
 * This interface only exists so that we do not have to check if the below
 * properties exist. We KNOW these properties will exist once this service has
 * been created, so it does not make sense to do checks like the following:
 *
 *    if (this.#options.allowMethods && ...) { }
 *    if (this.#options.allowOrigin && ...) { }
 *
 * That would be a bit annoying to have to do those checks.
 */
interface IOptions extends IConstructorOptions {
  allowMethods: TAllowMethod[];
  allowOrigin: TOrigin[];
  maxAge: number;
  preflight: boolean;
};

const headers = {
  ACAC: "Access-Control-Allow-Credentials",
  ACAH: "Access-Control-Allow-Headers",
  ACAM: "Access-Control-Allow-Methods",
  ACAO: "Access-Control-Allow-Origin",
  ACEH: "Access-Control-Expose-Headers",
  ACMA: "Access-Control-Max-Age",
  ACRH: "Access-Control-Request-Headers",
  ORIGIN: "Origin",
  VARY: "Vary",
};

/**
 * This class is responsible for handling all processes around CORS. It takes
 * inspiration from https://expressjs.com/en/resources/middleware/cors.html and
 * uses https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS as a backbone.
 */
export class CORSService extends Service implements Interfaces.IService {
  /**
   * Default options that this service uses if the user does not specify any
   * when using`new CORSServce()`.
   */
  #default_options: IOptions = {
    allowOrigin: ["*"],
    allowCredentials: true,
    allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    maxAge: 5,
    preflight: true,
  };

  /**
   * The actual options that this service uses when processesing code.
   */
  #options!: IOptions;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param options - Options used to override the default options.
   */
  constructor(options: IConstructorOptions = {}) {
    super();

    this.#setOptions(options);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PUBLIC METHODS //////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  runBeforeResource(request: Request, response: Response) {
    this.#performCorsProcess(request, response);
  }

  setUp(options: Interfaces.IServiceOptions): void {
    this.#addOptionsMethodToResources(options.resources);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PRIVATE METHODS /////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // #isRequestMethodAllowed(requestMethod: string): boolean {
  // }

  #setOptions(options: IConstructorOptions): void {
    this.#options = this.#default_options;
    Object.assign(this.#options, options);
  }

  /**
   * For all resources that do not have their OPTIONS method defined, create it
   * for them.
   *
   * @param resources - The resources that the server has registered.
   */
  #addOptionsMethodToResources(resources: Types.TResourcesAndPatterns): void {
    // Add the OPTIONS method to all resources
    for (const { resource, patterns } of resources.values()) {
      // Ignoring because the resource exists and can have an OPTIONS method. If
      // it does not have an OPTIONS method, then we add it.
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      if (!resource.OPTIONS) {
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        resource.OPTIONS = (_request: Request, _response: Response) => {
          return;
        }
      }
    }
  }

  #performCorsProcess(request: Request, response: Response): void {
    const requestOrigin = this.#getRequestOrigin(request);

    if (!requestOrigin) {
      throw new Errors.HttpError(401);
    }

    if (!this.#isRequestOriginAllowed(requestOrigin)) {
      throw new Errors.HttpError(401);
    }

    const requestMethod = request.method.toUpperCase();

    // this.#isRequestMethodAllowed(request.method.toUpperCase());

    if (request.method === "OPTIONS") {
      return this.#performPreflightProcess(
        request,
        response,
      );
    }

    // this.#performStandardProcess(request, response);
  }

  #setResponseAllowMethodsHeader(request: Request, response: Response): void {
    if (this.#options.allowMethods && this.#options.allowMethods.length > 0) {
      response.headers.set(headers.VARY, headers.ORIGIN);
      response.headers.set(headers.ACAM, this.#options.allowMethods.join(","));
    }
  }

  #setResponseAllowOriginHeader(request: Request, response: Response): void {
    if (this.#options.allowOrigin.includes("*")) {
      return response.headers.set(headers.ACAO, "*");
    }

    return response.headers.set(headers.ACAO, this.#getRequestOrigin(request)!);
  }

  /**
   * Perform a standard request.
   */
  // #performStandardProcess(request: Request, response: Response) {
  //   response.headers.set(
  //     corsHeaders.access_control_allow_origin,
  //     this.#options.allowOrigin,
  //   );

  //   response.headers.set(
  //     corsHeaders.vary,
  //     "Origin",
  //   );

  //   if (this.#options.allowCredentials) {
  //     response.headers.set(
  //       corsHeaders.access_control_allow_credentials,
  //       "true",
  //     );
  //   }

  //   if (this.#options.exposeHeaders) {
  //     response.headers.set(
  //       "Access-Control-Expose-Headers",
  //       this.#options.exposeHeaders.toString(),
  //     );
  //   }
  // }

  /**
   * Get the Origin header value from the request.
   *
   * @param request
   *
   * @returns The value of the Origin header.
   */
  #getRequestOrigin(request: Request): null | string {
    // Check for uppercase Origin header
    let requestOrigin = request.headers.get("Origin");

    // Still no header? Check for lowercase.
    if (!requestOrigin) {
      requestOrigin = request.headers.get("origin");
    }

    return requestOrigin ?? null;
  }

  /**
   * Perform a preflight request. That is, if the request method is OPTIONS,
   * then peform these steps.
   */
  #performPreflightProcess(
    request: Request,
    response: Response
  ) {
    response.headers.set(headers.VARY, "Origin");

    this.#setResponseAllowOriginHeader(request, response);

    if (this.#options.allowCredentials) {
      response.headers.set(headers.ACAC, "true");
    }

    this.#setResponseAllowMethodsHeader(request, response);

    if (this.#options.maxAge) {
      response.headers.set(headers.ACMA, this.#options.maxAge.toString());
    }

    if (typeof this.#options.exposeHeaders === "string") {
      response.headers.set(headers.ACEH, this.#options.exposeHeaders);
    }


    // Make sure to set a proper a 204 response. This means nulling out the
    // body, making sure the Content-Length is 0, and the status is 204. If
    // these are not set properly, then clients may not be able to handle this
    // response properly.
    response.status = 204;
    response.headers.set("Content-Length", "0");
    response.body = null;
  }

  /**
   * Is the request coming from an origin that is allowed?
   *
   * @param requestOrigin - The value of the request's Origin header.
   */
  #isRequestOriginAllowed(requestOrigin: string): boolean {
    if (this.#options.allowOrigin.includes("*")) {
      return true;
    }

    // The array of allowed origins can contain the request origin, so we check
    // each origin in the array. If this loop does not return, then the code
    // will continue and perform `throw error`.
    for (const origin of this.#options.allowOrigin) {
      if (origin instanceof RegExp) {
        const test = origin.test(requestOrigin);
        if (test) {
          return true;
        }
      }

      if (typeof origin === "string") {
        if (origin === requestOrigin) {
          return true;
        }
      }
    }

    return false;
  }
}
