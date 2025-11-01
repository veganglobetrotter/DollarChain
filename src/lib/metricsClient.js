// src/lib/metricsClient.js
import { supabase } from "./supabase";

/**
 * fetchPerformance(days = 28, itemName = null)
 * Calls RPC get_performance_metrics and returns the parsed object or throws.
 *
 * RPC accepts named params: { days, item_name }
 */
export async function fetchPerformance(days = 28, itemName = null) {
  const params = { days };
  if (itemName) params.item_name = itemName;

  const { data, error } = await supabase.rpc("get_performance_metrics", params);
  if (error) throw error;
  // data is jsonb; supabase-js returns it as plain object
  return data;
}
