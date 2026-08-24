// @ts-nocheck
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DashboardStats = ({ orders }: { orders: any[] }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
  
  const chartData = [
    { name: 'Mon', revenue: 4000, orders: 24 },
    { name: 'Tue', revenue: 3000, orders: 18 },
    { name: 'Wed', revenue: 2000, orders: 12 },
    { name: 'Thu', revenue: 2780, orders: 16 },
    { name: 'Fri', revenue: 1890, orders: 11 },
    { name: 'Sat', revenue: 2390, orders: 14 },
    { name: 'Sun', revenue: totalRevenue, orders: orders.length },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total Revenue</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total Orders</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{orders.length}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Active Orders</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{activeOrders}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Delivered</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{completedOrders}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '350px' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>Revenue Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#fc8019" strokeWidth={3} dot={{r:4}} activeDot={{r:8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '350px' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>Orders by Day</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    // Always fetch orders for dashboard stats
    fetch(`${API_URL}/api/orders/`)
      .then(res => res.json())
      .then(resData => {
        if (Array.isArray(resData)) setOrders(resData);
      }).catch(e => console.error(e));

    if (activeTab === 'dashboard') {
      setLoading(false);
      return;
    }

    // Since we don't have endpoints for all users, we map 'users' to something else or just show empty for now, 
    // unless we create a users API in the backend. I'll mock Users and Riders for demonstration of premium UI.
    if (activeTab === 'users' || activeTab === 'riders') {
        setTimeout(() => {
            setData([
                { id: 1, name: 'Piyush Customer', email: 'piyush@example.com', phone: '+919999999999', role: activeTab.toUpperCase(), joined: '2026-08-20' },
                { id: 2, name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+918888888888', role: activeTab.toUpperCase(), joined: '2026-08-22' }
            ]);
            setLoading(false);
        }, 500);
        return;
    }

    fetch(`${API_URL}/api/${activeTab}/`)
      .then(res => res.json())
      .then(resData => {
        if (Array.isArray(resData)) setData(resData);
        else setData([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', margin: 0, padding: 0, display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '25px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, color: '#fc8019', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>FoodAdmin</h2>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Superuser Dashboard</p>
        </div>
        <ul style={{ listStyle: 'none', padding: '15px 10px', margin: 0, flex: 1 }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'restaurants', label: '🏪 Restaurants' },
            { id: 'orders', label: '🛒 Orders Tracker' },
            { id: 'users', label: '👥 Customers' },
            { id: 'riders', label: '🛵 Delivery Partners' }
          ].map(tab => (
            <li 
              key={tab.id}
              style={{ 
                padding: '12px 15px', 
                cursor: 'pointer', 
                backgroundColor: activeTab === tab.id ? '#fff3ed' : 'transparent', 
                color: activeTab === tab.id ? '#fc8019' : '#4b5563',
                fontWeight: activeTab === tab.id ? '700' : '500',
                borderRadius: '8px',
                marginBottom: '5px',
                transition: 'all 0.2s'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#fc8019', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>A</div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#111827' }}>Admin User</h4>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>admin@system.com</span>
                </div>
            </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
          <h1 style={{ margin: 0, textTransform: 'capitalize', fontSize: '28px', color: '#111827' }}>{activeTab}</h1>
          <div style={{ backgroundColor: 'white', padding: '8px 15px', borderRadius: '20px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#6b7280' }}>
            System Status: <span style={{color: '#10b981', fontWeight: 'bold'}}>● Operational</span>
          </div>
        </div>

        {activeTab === 'dashboard' && <DashboardStats orders={orders} />}

        {activeTab !== 'dashboard' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            
            {loading ? <div style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>Loading data...</div> : null}
            
            {!loading && (activeTab === 'restaurants') && (
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>ID</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Restaurant</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Description</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Address/Pincode</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any) => (
                    <tr key={item.id} style={{borderTop: '1px solid #f3f4f6'}}>
                      <td style={{padding: '15px 20px', color: '#6b7280'}}>#{item.id}</td>
                      <td style={{padding: '15px 20px', fontWeight: '600', color: '#111827'}}>{item.name}</td>
                      <td style={{padding: '15px 20px', color: '#4b5563'}}>{item.description}</td>
                      <td style={{padding: '15px 20px', color: '#4b5563'}}>{item.address} {item.pincode ? `(${item.pincode})` : ''}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan={4} style={{padding: '30px', textAlign: 'center'}}>No restaurants found</td></tr>}
                </tbody>
              </table>
            )}

            {!loading && (activeTab === 'orders') && (
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Order ID</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Customer / Rest ID</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Status</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any) => (
                    <tr key={item.id} style={{borderTop: '1px solid #f3f4f6'}}>
                      <td style={{padding: '15px 20px', fontWeight: 'bold', color: '#111827'}}>#{item.id}</td>
                      <td style={{padding: '15px 20px', color: '#4b5563'}}>Cust: {item.customer_id} | Rest: {item.restaurant_id}</td>
                      <td style={{padding: '15px 20px'}}>
                        <span style={{
                          backgroundColor: item.status === 'DELIVERED' ? '#d1fae5' : (item.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7'), 
                          color: item.status === 'DELIVERED' ? '#065f46' : (item.status === 'CANCELLED' ? '#991b1b' : '#92400e'),
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{padding: '15px 20px', fontWeight: '600', color: '#111827'}}>₹{item.total_amount ? item.total_amount.toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan={4} style={{padding: '30px', textAlign: 'center'}}>No orders found</td></tr>}
                </tbody>
              </table>
            )}

            {!loading && (activeTab === 'users' || activeTab === 'riders') && (
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Name</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Contact</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Role</th>
                    <th style={{padding: '15px 20px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase'}}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any) => (
                    <tr key={item.id} style={{borderTop: '1px solid #f3f4f6'}}>
                      <td style={{padding: '15px 20px', fontWeight: 'bold', color: '#111827'}}>{item.name}</td>
                      <td style={{padding: '15px 20px', color: '#4b5563'}}>
                        <div>{item.email}</div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>{item.phone}</div>
                      </td>
                      <td style={{padding: '15px 20px'}}>
                        <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                          {item.role}
                        </span>
                      </td>
                      <td style={{padding: '15px 20px', color: '#6b7280'}}>{item.joined}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan={4} style={{padding: '30px', textAlign: 'center'}}>No data found</td></tr>}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminDashboard />
  </React.StrictMode>
);
