import React, { useState } from 'react';
import CustomerMenu from './src/components/CustomerMenu';
import AdminDashboard from './src/components/AdminDashboard';

export default function App() {
  // Options: 'customer' or 'admin'
  const [currentView, setCurrentView] = useState('customer');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      {/* Global Navigation Bar */}
      <nav style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
        <button 
          onClick={() => setCurrentView('customer')}
          style={{ marginRight: '10px', fontWeight: currentView === 'customer' ? 'bold' : 'normal' }}
        >
          Weekly Menu
        </button>
        <button 
          onClick={() => setCurrentView('admin')}
          style={{ fontWeight: currentView === 'admin' ? 'bold' : 'normal' }}
        >
          Admin Dashboard
        </button>
      </nav>

      {/* Conditional Rendering Logic */}
      <main>
        {currentView === 'customer' && <CustomerMenu />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}