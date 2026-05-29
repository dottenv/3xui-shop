import { useEffect, useState } from 'react'
import {
  Table, Card, Typography, Tag, Button, Modal, Form, Input, Space, Alert,
} from 'antd'
import { CrownOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import api from '../api'
import { useAuth } from '../AuthContext'

const { Title, Text } = Typography

export default function Admins() {
  const { admin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const isRoot = admin?.role === 'root'

  useEffect(() => {
    if (isRoot) {
      api.get('/admin/list').then(({ data }) => setAdmins(data)).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isRoot])

  async function onCreate(values) {
    setCreating(true)
    setError('')
    try {
      const { data } = await api.post('/admin/create', values)
      setAdmins((prev) => [...prev, data])
      setOpen(false)
      form.resetFields()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка создания')
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Роль',
      dataIndex: 'role',
      render: (v) => <Tag color={v === 'root' ? 'purple' : 'blue'}>{v === 'root' ? 'Root' : 'Администратор'}</Tag>,
      width: 150,
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активен' : 'Заблокирован'}</Tag>,
      width: 120,
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleDateString('ru-RU') : '—',
      width: 120,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Администраторы</Title>
        {isRoot && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Добавить администратора
          </Button>
        )}
      </div>

      {!isRoot && (
        <Alert
          message="Доступ ограничен"
          description="Только root-администратор может управлять администраторами."
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={isRoot ? admins : [admin].filter(Boolean)}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      </Card>

      <Modal
        title="Новый администратор"
        open={open}
        onCancel={() => { setOpen(false); setError('') }}
        footer={null}
        destroyOnClose
      >
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />}
        <Form form={form} layout="vertical" onFinish={onCreate}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Минимум 6 символов" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={creating} block>
              Создать
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
