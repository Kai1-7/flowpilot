import type { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

let app: FastifyInstance;

describe("template validation endpoint", () => {
  beforeAll(async () => {
    app = await buildApp({ scheduler: false });

    return async () => {
      await app.close();
    };
  });

  it("returns normalized config for valid template input", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/templates/api-health-check/validate",
      payload: {
        config: {
          url: "http://localhost:4357/api/health",
          method: "GET",
          expectedStatus: "200",
          timeoutMs: "5000"
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      templateKey: "api-health-check",
      config: {
        expectedStatus: 200,
        timeoutMs: 5000
      }
    });
  });

  it("returns validation details for invalid template input", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/templates/api-health-check/validate",
      payload: {
        config: {
          url: "not-a-url",
          method: "GET",
          expectedStatus: 200,
          timeoutMs: 5000
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("Validation failed");
  });
});
