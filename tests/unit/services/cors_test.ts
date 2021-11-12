import { Rhum } from "../../deps.ts";
import {
  IResource,
  Request,
  Resource,
  Response,
  Server,
} from "../../../mod.ts";
import { CORSService } from "../../../src/services/cors/_cors.ts";

class CorsResource extends Resource implements IResource {
  public paths = ["/cors"];

  public GET(_request: Request, response: Response) {
    response.text("GET request received!");
  }
}

function runServer(cors: CORSService): Server {
  const server = new Server({
    services: [cors],
    resources: [
      CorsResource,
    ],
    port: 1557,
    hostname: "0.0.0.0",
    protocol: "http",
  });
  server.run();
  return server;
}

Rhum.testPlan("cors/tests/mod_test.ts", () => {
  // Also covers unit tests
  Rhum.testSuite("Integration", () => {
    Rhum.testCase("Should shortcircuit preflight requests", async () => {
      const cors = new CORSService();

      const server = runServer(cors);

      const response = await fetch("http://localhost:1557/cors", {
        method: "OPTIONS",
        headers: {
          "Origin": "http://localhost",
          "Access-Control-Request-Method": "GET",
          Accept: "text/plain",
        },
      });

      Rhum.asserts.assertEquals(
        response.status,
        204,
      );

      Rhum.asserts.assertEquals(
        response.headers.get("access-control-allow-origin"),
        "*",
      );

      Rhum.asserts.assertEquals(
        response.headers.get("access-control-allow-methods"),
        "GET,HEAD,PUT,PATCH,POST,DELETE",
      );

      Rhum.asserts.assertEquals(response.headers.get("vary"), "Origin");
      Rhum.asserts.assertEquals(response.headers.get("content-length"), null);

      await server.close();
    });
  });
});

Rhum.run();
