import { useState, useEffect } from 'react'

function App() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => {
        setPlans(data.plans || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="logo">CWIM</h1>
          <nav>
            <a href="#plans">Тарифы</a>
            <a href="#features">Возможности</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h2>Быстрый и безопасный VPN</h2>
            <p>Защитите свою приватность. Получите доступ к любому контенту.</p>
          </div>
        </section>

        <section id="plans" className="plans">
          <div className="container">
            <h2>Тарифы</h2>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <div className="plans-grid">
                {plans.map((plan, i) => (
                  <div key={i} className="plan-card">
                    <h3>{plan.name}</h3>
                    <p>{plan.devices} {plan.devices === 1 ? 'устройство' : 'устройства'}</p>
                    <a href="#buy" className="btn btn-primary">Выбрать</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="features" className="features">
          <div className="container">
            <h2>Возможности</h2>
            <div className="features-grid">
              <div className="feature">
                <h3>Молниеносная скорость</h3>
                <p>Оптимизированные серверы для максимальной скорости</p>
              </div>
              <div className="feature">
                <h3>Безопасность</h3>
                <p>Шифрование военного класса</p>
              </div>
              <div className="feature">
                <h3>Обход блокировок</h3>
                <p>Доступ к любому контенту</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 CWIM. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
