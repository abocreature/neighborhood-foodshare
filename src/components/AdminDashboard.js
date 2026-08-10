import React from 'react';

// Mock data representing what will eventually be pulled from your Supabase 'claims' and 'customers' tables
const MOCK_ORDERS = [
  { id: 101, delivery_date: 'Mon, Aug 17', customer_name: 'Alice Smith', address: '123 Maple St, Marshall', dish_name: 'Garlic Herb Roasted Chicken', phone: '828-555-0143', status: 'Pending' },
  { id: 102, delivery_date: 'Mon, Aug 17', customer_name: 'Bob Jones', address: '456 Oak Rd, Marshall', dish_name: 'Garlic Herb Roasted Chicken', phone: '828-555-0199', status: 'Pending' },
  { id: 103, delivery_date: 'Wed, Aug 19', customer_name: 'Alice Smith', address: '123 Maple St, Marshall', dish_name: 'Classic Meatloaf', phone: '828-555-0143', status: 'Pending' },
  { id: 104, delivery_date: 'Fri, Aug 21', customer_name: 'Charlie Brown', address: '789 Pine Ln, Asheville', dish_name: 'Baked Ziti', phone: '828-555-0122', status: 'Delivered' }
];

function AdminDashboard() {
  // Simple calculation to show your dad quick summary metrics at the top
  const totalOrders = MOCK_ORDERS.length;
  const pendingOrders = MOCK_ORDERS.filter(o => o.status === 'Pending').length;

  return (
    <div style={{ padding: '10px' }}>
      <h2 style={{ color: '#222', margin: '0 0 5px 0' }}>Dad's Delivery Dashboard</h2>
      <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: '0.95rem' }}>Review weekly dinner claims and delivery routes.</p>

      {/* Summary Cards Row */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <span style={{ fontSize: '0.85rem', color: '#666', uppercase: 'true', fontWeight: 'bold' }}>Total Weekly Meals</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#222', marginTop: '5px' }}>{totalOrders}</div>
        </div>
        <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff8e1', borderColor: '#ffe082' }}>
          <span style={{ fontSize: '0.85rem', color: '#b78103', fontWeight: 'bold' }}>Meals to Cook</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b78103', marginTop: '5px' }}>{pendingOrders}</div>
        </div>
      </div>

      {/* Orders Table */}
      <h3 style={{ color: '#333', marginBottom: '10px' }}>Current Order Manifest</h3>
      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px' }}>Delivery Day</th>
              <th style={{ padding: '12px' }}>Customer</th>
              <th style={{ padding: '12px' }}>Meal Choice</th>
              <th style={{ padding: '12px' }}>Delivery Address</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDERS.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#444' }}>{order.delivery_date}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '500' }}>{order.customer_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#777' }}>{order.phone}</div>
                </td>
                <td style={{ padding: '12px', color: '#0066cc' }}>{order.dish_name}</td>
                <td style={{ padding: '12px', color: '#555' }}>{order.address}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    backgroundColor: order.status === 'Delivered' ? '#e6f4ea' : '#fff3e0',
                    color: order.status === 'Delivered' ? '#137333' : '#b06000'
                  }}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;