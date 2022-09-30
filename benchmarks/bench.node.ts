import * as Drash from "../mod.node.ts";

import { serve } from "https://deno.land/std@0.158.0/http/server.ts";

class HomeResource extends Drash.Resource {
  public paths = ["/:test"];

  public GET(
    request: Drash.Request,
    response: Drash.Response,
  ): Drash.Response {
    return response.body("Hello, Drash benchmarks!");
  }
}

const requestHandler = await Drash.createRequestHandler({
  resources: [
    HomeResource,
  ],
});

serve(requestHandler.handle.bind(requestHandler), {
  port: 1447,
  hostname: "localhost",
  onListen({ port, hostname }) {
    console.log(`Drash server started at http://${hostname}:${port}`);
  },
});
