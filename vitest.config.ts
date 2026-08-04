import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      /*
        `server-only` is a build-time marker Next resolves itself; it is not a real
        package here. Stubbing it lets server modules be unit-tested without dropping
        the import, which is what actually keeps them off the client bundle.
      */
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
});
