import { useEffect, useState, useCallback } from 'react'
import {
  Table, Card, Tag, Typography, Input, Space, Button, Modal, Form,
  Dropdown, message, Popconfirm, Switch,
} from 'antd'
import {
  SearchOutlined, EditOutlined, StopOutlined, CheckCircleOutlined,
  CrownOutlined, UserSwitchOutlined, DeleteOutlined, MoreOutlined,
} from '@ant-design/icons'
import api from '../api'

const { Title, Text } = Typography

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editForm] = Form.useForm()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.email?.toLowerCase() || '').includes(q) ||
           (u.first_name?.toLowerCase() || '').includes(q) ||
           (u.last_name?.toLowerCase() || '').includes(q) ||
           String(u.id).includes(q)
  })

  async function toggleBlock(user) {
    try {
      await api.post(`/admin/users/${user.id}/toggle-block`)
      message.success(user.is_active ? 'Пользователь заблокирован' : 'Пользователь разблокирован')
      load()
    } catch { message.error('Ошибка') }
  }

  async function toggleAdmin(user) {
    try {
      await api.post(`/admin/users/${user.id}/toggle-admin`)
      message.success(user.is_admin ? 'Права администратора отозваны' : 'Назначен администратором')
      load()
    } catch { message.error('Ошибка') }
  }

  function openEdit(user) {
    setEditing(user)
    editForm.setFieldsValue({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      is_active: user.is_active,
      is_admin: user.is_admin,
    })
    setEditOpen(true)
  }

  async function handleEdit(values) {
    try {
      await api.put(`/admin/users/${editing.id}`, values)
      message.success('Сохранено')
      setEditOpen(false)
      load()
    } catch (err) { message.error(err.response?.data?.detail || 'Ошибка') }
  }

  async function handleDelete(user) {
    try {
      await api.delete(`/admin/users/${user.id}`)
      message.success('Пользователь удалён')
      load()
    } catch (err) { message.error(err.response?.data?.detail || 'Ошибка') }
  }

  const contextMenu = (user) => ({
    items: [
      { key: 'edit', icon: <EditOutlined />, label: 'Редактировать' },
      { key: 'block', icon: user.is_active ? <StopOutlined /> : <CheckCircleOutlined />, label: user.is_active ? 'Заблокировать' : 'Разблокировать' },
      { key: 'admin', icon: <CrownOutlined />, label: user.is_admin ? 'Снять админа' : 'Назначить админом' },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: 'Удалить', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') openEdit(user)
      if (key === 'block') toggleBlock(user)
      if (key === 'admin') toggleAdmin(user)
      if (key === 'delete') Modal.confirm({
        title: 'Удалить пользователя',
        content: `Вы уверены, что хотите удалить ${user.email || `пользователя #${user.id}`}?`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        onOk: () => handleDelete(user),
      })
    },
  })

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60, sorter: (a, b) => a.id - b.id },
    {
      title: 'Email',
      dataIndex: 'email',
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Имя',
      dataIndex: 'first_name',
      render: (v, r) => [v, r.last_name].filter(Boolean).join(' ') || <Text type="secondary">—</Text>,
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активен' : 'Заблокирован'}</Tag>,
      width: 120,
      filters: [{ text: 'Активен', value: true }, { text: 'Заблокирован', value: false }],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Админ',
      dataIndex: 'is_admin',
      render: (v) => v ? <Tag color="purple">Да</Tag> : '—',
      width: 80,
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleDateString('ru-RU') : '—',
      width: 110,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown menu={contextMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
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
          onRow={(record) => ({
            onContextMenu: (e) => {
              e.preventDefault()
              // simple right-click: toggle block
              toggleBlock(record)
            },
            style: { cursor: 'context-menu' },
          })}
        />
      </Card>

      <Modal
        title="Редактировать пользователя"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="first_name" label="Имя">
            <Input placeholder="Имя" />
          </Form.Item>
          <Form.Item name="last_name" label="Фамилия">
            <Input placeholder="Фамилия" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Некорректный email' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="is_active" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="is_admin" label="Администратор" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
