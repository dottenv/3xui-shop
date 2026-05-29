import { useEffect, useState } from 'react'
import { Table, Card, Tag, Typography, Input, Space } from 'antd'
import { SearchOutlined, TeamOutlined } from '@ant-design/icons'
import api from '../api'

const { Title } = Typography

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.email?.toLowerCase() || '').includes(q) ||
           (u.first_name?.toLowerCase() || '').includes(q) ||
           (u.last_name?.toLowerCase() || '').includes(q) ||
           String(u.id).includes(q)
  })

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60, sorter: (a, b) => a.id - b.id },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Имя', dataIndex: 'first_name', render: (v, r) => [v, r.last_name].filter(Boolean).join(' ') || '—' },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активен' : 'Заблокирован'}</Tag>,
      width: 130,
      filters: [
        { text: 'Активен', value: true },
        { text: 'Заблокирован', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Админ',
      dataIndex: 'is_admin',
      render: (v) => v ? <Tag color="purple">Да</Tag> : '—',
      width: 90,
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleDateString('ru-RU') : '—',
      width: 130,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Пользователи</Title>
        <Input
          placeholder="Поиск по email, имени, ID"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={filtered}
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
