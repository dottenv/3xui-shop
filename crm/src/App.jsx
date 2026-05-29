import { useState, useEffect } from 'react'

function App() {
  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
    revenue: 0,
    servers: 0,
  })

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  return (
    <div className="crm">
      <aside className="sidebar">
        <h1 className="logo">CWIM CRM</h1>
        <nav>
          <a href="#dashboard" className="active">Дашборд</a>
          <a href="#users">Пользователи</a>
          <a href="#servers">Серверы</a>
          <a href="#payments">Платежи</a>
          <a href="#promocodes">Промокоды</a>
          <a href="#settings">Настройки</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <h2>Дашборд</h2>
        </header>

        <section className="content">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.users}</span>
              <span className="stat-label">Пользователей</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.transactions}</span>
              <span className="stat-label">Платежей</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.revenue} ₽</span>
              <span className="stat-label">Выручка</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.servers}</span>
              <span className="stat-label">Серверов</span>
            </div>
          </div>

          <div className="panel">
            <h3>Последние платежи</h3>
            <p className="muted">Нет данных</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
