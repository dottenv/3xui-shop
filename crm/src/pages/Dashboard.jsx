import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import api from '../api'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data))
    api.get('/admin/users').then(({ data }) => setUsers(data.slice(0, 5)))
  }, [])

  const cards = stats ? [
    { title: 'Пользователи', value: stats.users_total, icon: <TeamOutlined />, color: '#1677ff', bg: '#e6f4ff', key: 'users_total' },
    { title: 'Активные', value: stats.users_active, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed', key: 'users_active' },
    { title: 'Серверы', value: `${stats.servers_online}/${stats.servers_total}`, icon: <CloudServerOutlined />, color: '#722ed1', bg: '#f9f0ff', key: 'servers' },
    { title: 'Выручка', value: `${stats.total_revenue.toLocaleString()} ₽`, icon: <DollarOutlined />, color: '#faad14', bg: '#fffbe6', key: 'revenue' },
  ] : []

  const userColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Имя', dataIndex: 'first_name', render: (v) => v || '—' },
    { title: 'Статус', dataIndex: 'is_active', render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активен' : 'Заблокирован'}</Tag>, width: 120 },
    { title: 'Дата', dataIndex: 'created_at', render: (v) => v ? new Date(v).toLocaleDateString('ru-RU') : '—', width: 110 },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Дашборд</Title>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {cards.map((c) => (
            <Col xs={12} sm={12} md={6} key={c.key}>
              <Card hoverable style={{ borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, color: c.color }}>{c.icon}</span>
                  </div>
                  <Statistic title={c.title} value={c.value} valueStyle={{ fontSize: 22, fontWeight: 600 }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card
        title="Последние пользователи"
        style={{ borderRadius: 12 }}
        extra={<a onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>Все пользователи</a>}
      >
        <Table
          dataSource={users}
          columns={userColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}
