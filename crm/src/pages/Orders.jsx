import { useEffect, useState } from 'react'
import { Table, Card, Typography, Tag, Space } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import api from '../api'

const { Title } = Typography

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
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Пользователь', dataIndex: 'user_id', width: 120 },
    { title: 'Сумма', dataIndex: 'amount', render: (v) => <strong>{v} ₽</strong>, width: 110 },
    { title: 'Валюта', dataIndex: 'currency', width: 80 },
    {
      title: 'Статус',
      dataIndex: 'status',
      render: (v) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>,
      width: 120,
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleString('ru-RU') : '—',
      width: 170,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Оплачен',
      dataIndex: 'paid_at',
      render: (v) => v ? new Date(v).toLocaleString('ru-RU') : '—',
      width: 170,
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
