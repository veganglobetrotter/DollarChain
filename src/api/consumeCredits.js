// src/api/consumeCredits.js
import { supabaseAdmin } from '../supabaseClient';

export default async function handler(req, res) {
  try {
    const { userId, reservationId, delta, type, reference } = req.body;

    if (!userId || !reservationId || !delta || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .rpc('consume_reserved_credits', { _user_id: userId, _reservation_id: reservationId, _delta: delta, _type: type, _reference: reference });

    if (error) throw error;

    return res.status(200).json({ success: true, transaction: data });
  } catch (err) {
    console.error('consumeCredits error:', err);
    return res.status(500).json({ error: err.message });
  }
}
