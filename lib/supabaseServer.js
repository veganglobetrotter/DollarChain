/*
  Root wrapper so serverless functions (deployed under /var/task)
  that import "lib/supabaseServer.js" will find the implementation.
  This simply re-exports the real file located at api/lib/supabaseServer.js.
*/
export * from "./api/lib/supabaseServer.js";
