import { useEffect, useState } from 'react'
import { Typography, Table, Tag, Button, Modal, Input, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons'
import api from '../api'

const { Title, Text } = Typography

export default function IpWhitelist() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [newComment, setNewComment] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/admin/whitelist').then(({ data }) => setList(data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newIp.trim()) return message.warning('Введите IP-адрес')
    try {
      await api.post('/admin/whitelist', { ip_address: newIp.trim(), comment: newComment.trim() || null })
      message.success('IP добавлен')
      setAddOpen(false)
      setNewIp('')
      setNewComment('')
      load()
    } catch (err) {
      message.error(err.response?.data?.detail || 'Ошибка')
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/whitelist/${id}`)
      message.success('Удалён')
      load()
    } catch { message.error('Ошибка') }
  }

  const columns = [
    { title: 'IP-адрес', dataIndex: 'ip_address', width: 200 },
    { title: 'Комментарий', dataIndex: 'comment', render: (v) => v || <Text type="secondary">—</Text> },
    {
      title: 'Статус', dataIndex: 'is_active', width: 100,
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активен' : 'Отключён'}</Tag>,
    },
    {
      title: 'Дата', dataIndex: 'created_at', width: 160,
      render: (v) => v ? new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_, record) => (
        <Popconfirm title="Удалить IP из whitelist?" onConfirm={() => handleDelete(record.id)} okText="Да" cancelText="Нет">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LockOutlined style={{ fontSize: 22, color: '#8b5cf6' }} />
          <Title level={4} style={{ margin: 0 }}>IP Whitelist</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          Добавить IP
        </Button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      </div>

      {list.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Text type="secondary">Whitelist пуст. Добавьте IP-адреса, которые смогут обходить режим обслуживания.</Text>
        </div>
      )}

      <Modal
        title="Добавить IP-адрес"
        open={addOpen}
        onCancel={() => { setAddOpen(false); setNewIp(''); setNewComment('') }}
        onOk={handleAdd}
        okText="Добавить"
        cancelText="Отмена"
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>IP-адрес</Text>
            <Input placeholder="8.8.8.8" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
          </div>
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Комментарий</Text>
            <Input placeholder="Офис / Сервер / Разработчик" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
