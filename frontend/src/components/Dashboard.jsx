import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Personal Dashboard</h1>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Welcome</h2>
            <p>Your personal dashboard is ready!</p>
            <p className="card-info">
              Dashboard is running in standalone mode.
            </p>
          </div>

          <div className="dashboard-card">
            <h2>Quick Stats</h2>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-value">-</span>
                <span className="stat-label">Items</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">-</span>
                <span className="stat-label">Tasks</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">-</span>
                <span className="stat-label">Notes</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Recent Activity</h2>
            <p className="card-info">No recent activity to display.</p>
          </div>

          <div className="dashboard-card">
            <h2>Status</h2>
            <div className="status-indicator">
              <span className="status-dot offline"></span>
              <span>Standalone Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

