// src/api/releaseCredits.js
import { supabaseAdmin } from '../supabaseClient';

export default async function handler(req, res) {
  try {
    const { userId, reservationId } = req.body;

    if (!userId || !reservationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .rpc('release_reserved_credits', { _user_id: userId, _reservation_id: reservationId });

    if (error) throw error;

    return res.status(200).json({ success: true, reservation: data });
  } catch (err) {
    console.error('releaseCredits error:', err);
    return res.status(500).json({ error: err.message });
  }
}
