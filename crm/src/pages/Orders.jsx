import { useEffect, useState } from 'react'
import { Table, Card, Typography, Tag, Space } from 'antd'
import { ShoppingCartOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import api from '../api'

const { Title, Text } = Typography

const planLabels = {
  start: 'Старт',
  optimal: 'Оптимальный',
  maximum: 'Максимум',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/transactions').then(({ data }) => setOrders(data)).finally(() => setLoading(false))
  }, [])

  const statusColors = {
    completed: 'green',
    pending: 'gold',
    failed: 'red',
    refunded: 'orange',
  }

  const statusLabels = {
    completed: 'Завершён',
    pending: 'Ожидает',
    failed: 'Ошибка',
    refunded: 'Возврат',
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Пользователь', dataIndex: 'user_id', width: 100 },
    {
      title: 'Тариф',
      key: 'plan',
      width: 120,
      render: (_, r) => r.duration_days
        ? <>{r.devices} устр. / {r.duration_days} дн.</>
        : '—',
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      render: (v) => <strong>{Number(v).toLocaleString('ru-RU')} ₽</strong>,
      width: 100,
    },
    { title: 'Устройств', dataIndex: 'devices', width: 90 },
    {
      title: 'Статус',
      dataIndex: 'status',
      render: (v) => (
        <Tag color={statusColors[v] || 'default'} icon={v === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
          {statusLabels[v] || v}
        </Tag>
      ),
      width: 110,
    },
    { title: 'Платёж', dataIndex: 'payment_gateway', width: 90 },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleString('ru-RU') : '—',
      width: 160,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Оплачен',
      dataIndex: 'paid_at',
      render: (v) => v ? new Date(v).toLocaleString('ru-RU') : '—',
      width: 160,
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Заказы</Title>
      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `Всего: ${t}` }}
        />
      </Card>
    </div>
  )
}
