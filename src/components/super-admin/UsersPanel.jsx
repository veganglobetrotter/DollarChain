// src/components/super-admin/UsersPanel.jsx
import React from "react";

export default function UsersPanel({ users = [], loading = false }) {
  if (loading) return <p>Loading users…</p>;
  if (!users.length) return <p>No users found.</p>;

  return (
    <div>
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Super Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.full_name || (u.metadata?.name) || "-"}</td>
              <td>{u.email || u.metadata?.email || "-"}</td>
              <td>{u.phone || u.metadata?.phone || "-"}</td>
              <td>{String(u.is_super_admin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
