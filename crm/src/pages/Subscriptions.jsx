import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Modal, Typography } from 'antd'
import { ReloadOutlined, StopOutlined } from '@ant-design/icons'
import { apiJson } from '../api'

const { Title } = Typography

export default function Subscriptions() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(false)

  async function fetchSubs() {
    setLoading(true)
    try {
      const data = await apiJson('/admin/subscriptions')
      setSubs(data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubs() }, [])

  function handleRevoke(sub) {
    Modal.confirm({
      title: 'Отозвать подписку?',
      content: `Подписка #${sub.id} пользователя #${sub.user_id} будет немедленно отключена.`,
      okText: 'Отозвать',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await apiJson(`/admin/subscriptions/${sub.id}/revoke`, { method: 'POST' })
          message.success('Подписка отозвана')
          fetchSubs()
        } catch (err) {
          message.error(err.message)
        }
      },
    })
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'User ID', dataIndex: 'user_id', key: 'user_id', width: 80 },
    { title: 'Тариф', dataIndex: 'plan_id', key: 'plan_id' },
    { title: 'Сервер', dataIndex: 'server_id', key: 'server_id', width: 80 },
    { title: 'UUID', dataIndex: 'client_uuid', key: 'client_uuid', ellipsis: true },
    {
      title: 'Статус', dataIndex: 'is_active', key: 'is_active', width: 100,
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активна' : 'Отозвана'}</Tag>,
    },
    {
      title: 'Истекает', dataIndex: 'expires_at', key: 'expires_at', width: 120,
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      title: 'Создана', dataIndex: 'created_at', key: 'created_at', width: 120,
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      title: 'Действия', key: 'actions', width: 100,
      render: (_, r) => r.is_active ? (
        <Button size="small" danger icon={<StopOutlined />} onClick={() => handleRevoke(r)}>
          Отозвать
        </Button>
      ) : null,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Подписки</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchSubs}>Обновить</Button>
      </div>

      <Table
        dataSource={subs}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}
