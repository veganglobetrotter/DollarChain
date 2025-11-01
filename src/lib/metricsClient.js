// src/lib/metricsClient.js
import { supabase } from "./supabase";

/**
 * fetchPerformance(days = 28)
 * Calls RPC get_performance_metrics and returns the parsed object or throws.
 */
export async function fetchPerformance(days = 28) {
  const { data, error } = await supabase.rpc("get_performance_metrics", { days });
  if (error) throw error;
  // data is jsonb; supabase-js returns it as plain object
  return data;
}
