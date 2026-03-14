import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const API_BASE = 'http://localhost:8000';

const AdminDashboard = () => {
  const { sessionToken } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  const authHeaders = { Authorization: sessionToken || '' };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, statsRes, ordersRes, menuRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/admin-api/profile`,    { headers: authHeaders }),
        fetch(`${API_BASE}/admin-api/stats`,      { headers: authHeaders }),
        fetch(`${API_BASE}/admin-api/orders`,     { headers: authHeaders }),
        fetch(`${API_BASE}/admin-api/menu-items`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin-api/users`,      { headers: authHeaders }),
      ]);

      if (!statsRes.ok || !ordersRes.ok || !menuRes.ok || !usersRes.ok) {
        throw new Error('Failed to load dashboard data. Make sure you are logged in as admin.');
      }

      const profileData = await profileRes.json();
      if (!profileData.profile) {
        navigate('/admin/setup', { replace: true });
        return;
      }

      const [statsData, ordersData, menuData, usersData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        menuRes.json(),
        usersRes.json(),
      ]);

      setStats(statsData);
      setOrders(ordersData.orders || []);
      setMenuItems(menuData.menu_items || []);
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n) => `$${Number(n).toFixed(2)}`;
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-header__title">Dashboard</div>
          <div className="dash-header__sub">Real-time overview of your restaurant</div>
        </div>
        <button className="dash-refresh-btn" onClick={fetchAll} disabled={loading}>
          {loading ? <span className="dash-spinner" /> : '↻'} Refresh
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      {stats && (
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-card__icon">🧾</div>
            <div className="stat-card__label">Total Orders</div>
            <div className="stat-card__value">{stats.total_orders}</div>
          </div>
          <div className="stat-card stat-card--pending">
            <div className="stat-card__icon">⏳</div>
            <div className="stat-card__label">Pending</div>
            <div className="stat-card__value">{stats.pending_orders}</div>
          </div>
          <div className="stat-card stat-card--revenue">
            <div className="stat-card__icon">💰</div>
            <div className="stat-card__label">Revenue</div>
            <div className="stat-card__value">{fmt(stats.total_revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">🍽</div>
            <div className="stat-card__label">Menu Items</div>
            <div className="stat-card__value">
              {stats.available_menu_items}
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                /{stats.total_menu_items}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">👥</div>
            <div className="stat-card__label">Users</div>
            <div className="stat-card__value">{stats.total_users}</div>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="dash-tabs">
        <button
          className={`dash-tab${activeTab === 'orders' ? ' active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          🧾 Recent Orders
          <span className="dash-tab__count">{orders.length}</span>
        </button>
        <button
          className={`dash-tab${activeTab === 'menu' ? ' active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          🍽 Menu Items
          <span className="dash-tab__count">{menuItems.length}</span>
        </button>
        <button
          className={`dash-tab${activeTab === 'users' ? ' active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
          <span className="dash-tab__count">{users.length}</span>
        </button>
      </div>

      {/* Tab content */}
      <div className="dash-tab-content">
        {/* Orders table */}
        {activeTab === 'orders' && (
          <div className="dash-section animated-section">
            <div className="dash-table-wrap">
              {orders.length === 0 && !loading ? (
                <div className="dash-empty">No orders yet.</div>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{order.id}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {order.items?.map((item, i) => (
                              <span key={i} className="order-item-pill">
                                {item.menu_item_name} <span className="qty-badge">×{item.quantity}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {fmt(order.total_amount)}
                        </td>
                        <td>
                          <span className={`status-badge status-badge--${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{fmtDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Menu items table */}
        {activeTab === 'menu' && (
          <div className="dash-section animated-section">
            <div className="dash-table-wrap">
              {menuItems.length === 0 && !loading ? (
                <div className="dash-empty">No menu items found.</div>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{item.id}</td>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.category}</td>
                        <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>
                          {fmt(item.price)}
                        </td>
                        <td>
                          <span className={`avail-dot avail-dot--${item.is_available ? 'yes' : 'no'}`} />
                          {item.is_available ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Users table */}
        {activeTab === 'users' && (
          <div className="dash-section animated-section">
            <div className="dash-table-wrap">
              {users.length === 0 && !loading ? (
                <div className="dash-empty">No users yet.</div>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{u.id}</td>
                        <td style={{ fontWeight: 500 }}>{u.username}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td>
                          <span className={`status-badge ${u.role === 'admin' ? 'status-badge--confirmed' : 'status-badge--delivered'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{fmtDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
