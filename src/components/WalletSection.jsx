// src/components/WalletSection.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

export default function WalletSection({ userId }) {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState([]);

  // Fetch wallet balance
  async function fetchWallet() {
    const { data, error } = await supabase
      .from('dc_user_wallets')
      .select('credits_bigint')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error(error);
      setMessage('Error loading wallet');
    } else {
      setCredits(data.credits_bigint);
    }
  }

  // Fetch transaction history
  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('dc_credit_transactions')
      .select('delta, balance_after, type, reference, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setMessage('Error loading transactions');
    } else {
      setTransactions(data);
    }
  }

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [userId]);

  // Reserve credits
  async function reserveCredits(amount = 10) {
    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await axios.post('/api/reserveCredits', { userId, amount, idempotencyKey });
      setReservationId(res.data.reservation.id || res.data.reservation_id);
      setMessage(`Reserved ${amount} credits successfully!`);
      await fetchWallet();
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Failed to reserve credits');
    }
    setLoading(false);
  }

  // Consume credits
  async function consumeCredits() {
    if (!reservationId) {
      setMessage('No reservation to consume');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/consumeCredits', {
        userId,
        reservationId,
        delta: 10,
        type: 'invoice',
        reference: 'test-invoice'
      });
      setMessage('Consumed credits successfully!');
      setReservationId(null);
      await fetchWallet();
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Failed to consume credits');
    }
    setLoading(false);
  }

  // Release credits
  async function releaseCredits() {
    if (!reservationId) {
      setMessage('No reservation to release');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/releaseCredits', { userId, reservationId });
      setMessage('Released credits successfully!');
      setReservationId(null);
      await fetchWallet();
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Failed to release credits');
    }
    setLoading(false);
  }

  return (
    <div className="wallet-section p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Wallet</h2>
      <p className="mb-2">
        Available Credits: {credits !== null ? credits : 'Loading...'}
      </p>
      <p className="mb-4 text-sm text-gray-500">{message}</p>

      {/* TEST BUTTONS - remove later during cleanup */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => reserveCredits(10)}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Reserve 10 Credits
        </button>
        <button
          onClick={consumeCredits}
          disabled={loading || !reservationId}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        >
          Consume Credits
        </button>
        <button
          onClick={releaseCredits}
          disabled={loading || !reservationId}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Release Credits
        </button>
      </div>
      {/* End of test buttons */}

      <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Delta</th>
              <th className="border px-2 py-1">Type</th>
              <th className="border px-2 py-1">Reference</th>
              <th className="border px-2 py-1">Balance After</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{new Date(tx.created_at).toLocaleString()}</td>
                <td className={`border px-2 py-1 ${tx.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.delta}
                </td>
                <td className="border px-2 py-1">{tx.type}</td>
                <td className="border px-2 py-1">{tx.reference || '-'}</td>
                <td className="border px-2 py-1">{tx.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
