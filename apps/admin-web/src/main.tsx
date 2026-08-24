import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRest, setNewRest] = useState({ name: '', description: '', address: '' });

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_URL}/api/${activeTab}/`)
      .then(res => res.json())
      .then(resData => {
        if (Array.isArray(resData)) {
          setData(resData);
        } else {
          setData([]);
          console.error("API Error:", resData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAddRestaurant = async (e: any) => {
    e.preventDefault();
    // Since we don't have a direct /api/restaurants/ POST endpoint yet (except for users), 
    // we'll just mock this for now to show the UI works, or if the API exists, call it.
    alert("In a real app, this would create a User (RESTAURANT) and a Profile. Seed script was used instead.");
    setShowAdd(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', backgroundColor: '#1f2937', color: 'white', padding: '20px' }}>
        <h2>Admin Panel</h2>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '30px' }}>
          <li 
            style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeTab === 'restaurants' ? '#374151' : 'transparent', borderRadius: '4px' }}
            onClick={() => setActiveTab('restaurants')}
          >
            Restaurants
          </li>
          <li 
            style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeTab === 'orders' ? '#374151' : 'transparent', borderRadius: '4px' }}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '30px', backgroundColor: '#f3f4f6', overflowY: 'auto' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1 style={{textTransform: 'capitalize'}}>{activeTab} Management</h1>
          {activeTab === 'restaurants' && (
            <button 
              onClick={() => setShowAdd(!showAdd)}
              style={{backgroundColor: '#ff5a5f', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer'}}
            >
              {showAdd ? 'Cancel' : '+ Add Restaurant'}
            </button>
          )}
        </div>

        {showAdd && activeTab === 'restaurants' && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Add New Restaurant</h3>
            <form onSubmit={handleAddRestaurant} style={{display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px'}}>
              <input placeholder="Restaurant Name" required style={{padding: '8px'}} value={newRest.name} onChange={e => setNewRest({...newRest, name: e.target.value})} />
              <input placeholder="Description" required style={{padding: '8px'}} value={newRest.description} onChange={e => setNewRest({...newRest, description: e.target.value})} />
              <input placeholder="Address" required style={{padding: '8px'}} value={newRest.address} onChange={e => setNewRest({...newRest, address: e.target.value})} />
              <button type="submit" style={{backgroundColor: '#1f2937', color: 'white', border: 'none', padding: '10px', cursor: 'pointer'}}>Save Restaurant</button>
            </form>
          </div>
        )}

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          
          {loading ? <p>Loading data from database...</p> : null}
          
          {!loading && activeTab === 'restaurants' && (
            <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee'}}>
                  <th style={{padding: '10px'}}>ID</th>
                  <th style={{padding: '10px'}}>Name</th>
                  <th style={{padding: '10px'}}>Description</th>
                  <th style={{padding: '10px'}}>Address</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any) => (
                  <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '10px'}}>{item.id}</td>
                    <td style={{padding: '10px', fontWeight: 'bold'}}>{item.name}</td>
                    <td style={{padding: '10px'}}>{item.description}</td>
                    <td style={{padding: '10px'}}>{item.address}</td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={4}>No data found</td></tr>}
              </tbody>
            </table>
          )}

          {!loading && activeTab !== 'restaurants' && (
            <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee'}}>
                  <th style={{padding: '10px'}}>Order ID</th>
                  <th style={{padding: '10px'}}>Customer ID</th>
                  <th style={{padding: '10px'}}>Status</th>
                  <th style={{padding: '10px'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any) => (
                  <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '10px', fontWeight: 'bold'}}>#{item.id}</td>
                    <td style={{padding: '10px'}}>User {item.customer_id}</td>
                    <td style={{padding: '10px'}}>
                      <span style={{backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'}}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{padding: '10px'}}>${item.total_amount ? item.total_amount.toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={4}>No orders found</td></tr>}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminDashboard />
  </React.StrictMode>
);
