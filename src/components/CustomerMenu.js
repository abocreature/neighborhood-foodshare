import React, { useState } from 'react';

// Hardcoded sample data matching your Supabase 'menu_items' schema
const MOCK_MENU = [
  { id: 1, delivery_date: 'Mon, Aug 3', dish_name: 'Garlic Herb Roasted Chicken', description: 'Served with mashed potatoes and green beans.' },
  { id: 2, delivery_date: 'Wed, Aug 5', dish_name: 'Classic Meatloaf', description: 'With honey-glazed carrots and a side of mac & cheese.' },
  { id: 3, delivery_date: 'Fri, Aug 7', dish_name: 'Baked Ziti', description: 'Layered with rich marinara, ricotta, and melted mozzarella.' }
];

function CustomerMenu() {
  // Local state to track which items the customer has clicked
  const [claimedItems, setClaimedItems] = useState([]);

  const handleClaim = (itemId) => {
    // For now, toggle the item in local UI state to see it work
    if (claimedItems.includes(itemId)) {
      setClaimedItems(claimedItems.filter(id => id !== itemId));
    } else {
      setClaimedItems([...claimedItems, itemId]);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#333' }}>Upcoming Weekly Menu</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Select the days you would like to claim your dinner delivery:</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {MOCK_MENU.map((item) => {
          const isClaimed = claimedItems.includes(item.id);
          
          return (
            <div 
              key={item.id} 
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: isClaimed ? '#e6f4ea' : '#fff',
                borderColor: isClaimed ? '#34a853' : '#ddd',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'bold' }}>{item.delivery_date}</span>
                  <h3 style={{ margin: '5px 0', color: '#222' }}>{item.dish_name}</h3>
                  <p style={{ margin: 0, color: '#555', fontSize: '0.95rem' }}>{item.description}</p>
                </div>
                
                <button
                  onClick={() => handleClaim(item.id)}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '5px',
                    border: '1px solid',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    backgroundColor: isClaimed ? '#34a853' : '#fff',
                    color: isClaimed ? '#fff' : '#333',
                    borderColor: isClaimed ? '#34a853' : '#ccc'
                  }}
                >
                  {isClaimed ? '✓ Claimed' : 'Claim Meal'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CustomerMenu;