/*
  Stub for the `server-only` marker package under vitest.

  Next resolves `server-only` at build time to fail the build if a server module is
  imported from a client component. It is not importable in a plain node process, so
  unit tests would either crash or force us to delete the import from the module under
  test — and deleting it is what would let a secret-bearing module reach the browser.
*/
export {};
