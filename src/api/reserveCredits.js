// src/api/reserveCredits.js
import { supabaseAdmin } from '../supabaseClient'; // your server-side supabase client

export default async function handler(req, res) {
  try {
    const { userId, amount, idempotencyKey } = req.body;

    if (!userId || !amount || !idempotencyKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Start transaction
    const { data, error } = await supabaseAdmin
      .rpc('reserve_credits_transaction', { _user_id: userId, _amount: amount, _idempotency_key: idempotencyKey });

    if (error) throw error;

    return res.status(200).json({ success: true, reservation: data });
  } catch (err) {
    console.error('reserveCredits error:', err);
    return res.status(500).json({ error: err.message });
  }
}
