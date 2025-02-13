/**
 * This test addresses an issue where someone on the discord had their default
 * content type set, but on  browser requests the response  was "null". This is
 * because originally, the response class didn't fully take into account the
 * config AND the accept headers.  Essentially meaning, returning text/html (as
 * this was the first type on the request)
 */

import { assert, assertEquals, assertNotEquals, delay } from "../deps.ts";
import { Interfaces, Request, Resource, Response, Server } from "../../mod.ts";
import { ETagService } from "../../src/services/etag/etag.ts";

////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - APP SETUP /////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

class ETagResource extends Resource {
  paths = ["/etag/:name?"];

  public GET(request: Request, response: Response) {
    const name = request.pathParam("name") ?? "";
    response.text("hello " + name);
  }
}

const configs: Interfaces.IServerOptions = {
  resources: [
    ETagResource,
  ],
  protocol: "http",
  hostname: "localhost",
  port: 3000,
};

function makeServer(weak = false) {
  return new Server({
    ...configs,
    services: [new ETagService({ weak })],
  });
}

////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - TESTS /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

Deno.test("etag_test.ts", async (t) => {
  await t.step("GET /etag", async (t) => {
    await t.step("Should set the header and default to strong", async () => {
      const strongServer = makeServer();
      strongServer.run();
      // Example browser request
      const response = await fetch(
        `${strongServer.address}/etag`,
      );
      await strongServer.close();
      assertEquals(await response.text(), "hello ");
      const header = response.headers.get("etag") ?? "";
      assert(header.match(/\"\d-.*\"/));
      assert(response.headers.get("last-modified"));
    });
    await t.step(
      "Should set the header and be weak if specified",
      async () => {
        const weakServer = makeServer(true);
        weakServer.run();
        // Example browser request
        const response = await fetch(
          `${weakServer.address}/etag`,
        );
        await weakServer.close();
        assertEquals(await response.text(), "hello ");
        const header = response.headers.get("etag") ?? "";
        assert(header.match(/W\/\"\d-.*\"/));
        assert(response.headers.get("last-modified"));
      },
    );
    await t.step(
      "Header values stay the same after 2 reqs with same body",
      async () => {
        const strongServer = makeServer();
        strongServer.run();
        // Example browser request
        const response1 = await fetch(
          `${strongServer.address}/etag`,
        );
        await response1.text();
        const response2 = await fetch(
          `${strongServer.address}/etag`,
        );
        await response2.text();
        await strongServer.close();
        const lastModified1 = response1.headers.get("last-modified");
        const etag1 = response1.headers.get("etag");
        const lastModified2 = response1.headers.get("last-modified");
        const etag2 = response1.headers.get("etag");
        assertEquals(lastModified1, lastModified2);
        assertEquals(etag1, etag2);
      },
    );
    await t.step(
      "Header values are different after 2nd req has different body",
      async () => {
        const strongServer = makeServer();
        strongServer.run();
        const response1 = await fetch(
          `${strongServer.address}/etag`,
        );
        await response1.text();
        await delay(1500);
        const response2 = await fetch(
          `${strongServer.address}/etag/edward`,
        );
        await response2.text();
        await strongServer.close();
        const lastModified1 = response1.headers.get("last-modified");
        const etag1 = response1.headers.get("etag");
        const lastModified2 = response2.headers.get("last-modified");
        const etag2 = response2.headers.get("etag");
        assertNotEquals(lastModified1, lastModified2);
        assertNotEquals(etag1, etag2);
      },
    );
  });
});
