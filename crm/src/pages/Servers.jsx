import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Typography } from 'antd'
import { PlusOutlined, ReloadOutlined, ApiOutlined } from '@ant-design/icons'
import { apiJson } from '../api'

const { Title } = Typography

export default function Servers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [testing, setTesting] = useState(null)
  const [form] = Form.useForm()

  async function fetchServers() {
    setLoading(true)
    try {
      const data = await apiJson('/admin/servers')
      setServers(data)
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServers() }, [])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  function openEdit(record) {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  async function handleSave() {
    const values = await form.validateFields()
    try {
      if (editing) {
        await apiJson(`/admin/servers/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        })
        message.success('Сервер обновлён')
      } else {
        await apiJson('/admin/servers', {
          method: 'POST',
          body: JSON.stringify(values),
        })
        message.success('Сервер создан')
      }
      setModalOpen(false)
      fetchServers()
    } catch (err) {
      message.error(err.message)
    }
  }

  async function handleDelete(id) {
    Modal.confirm({
      title: 'Удалить сервер?',
      content: 'Это действие необратимо.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await apiJson(`/admin/servers/${id}`, { method: 'DELETE' })
          message.success('Сервер удалён')
          fetchServers()
        } catch (err) {
          message.error(err.message)
        }
      },
    })
  }

  async function handleTest(id) {
    setTesting(id)
    try {
      const result = await apiJson(`/admin/servers/${id}/test`)
      if (result.success) {
        message.success(result.message || 'Подключение успешно')
      } else {
        message.error(result.message || 'Ошибка подключения')
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setTesting(null)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Хост', dataIndex: 'host', key: 'host' },
    { title: 'Порт', dataIndex: 'port', key: 'port', width: 80 },
    { title: 'Локация', dataIndex: 'location', key: 'location' },
    { title: 'Страна', dataIndex: 'country', key: 'country', width: 80 },
    { title: 'Inbound', dataIndex: 'inbound_id', key: 'inbound_id', width: 80 },
    { title: 'Протокол', dataIndex: 'protocol', key: 'protocol', width: 100 },
    {
      title: 'Статус', key: 'status', width: 120,
      render: (_, r) => (
        <Space>
          <Tag color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Активен' : 'Неактивен'}</Tag>
          <Tag color={r.is_online ? 'blue' : 'default'}>{r.is_online ? 'Online' : 'Offline'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Клиенты', key: 'clients', width: 100,
      render: (_, r) => `${r.current_clients}/${r.max_clients}`,
    },
    {
      title: 'Действия', key: 'actions', width: 200,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<ApiOutlined />} loading={testing === r.id} onClick={() => handleTest(r.id)}>
            Test
          </Button>
          <Button size="small" onClick={() => openEdit(r)}>Ред.</Button>
          <Button size="small" danger onClick={() => handleDelete(r.id)}>Уд.</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Серверы</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchServers}>Обновить</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Добавить сервер</Button>
        </Space>
      </div>

      <Table
        dataSource={servers}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={false}
      />

      <Modal
        title={editing ? 'Редактировать сервер' : 'Новый сервер'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="host" label="Хост" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="port" label="Порт" initialValue={443}>
              <InputNumber min={1} max={65535} />
            </Form.Item>
            <Form.Item name="sub_port" label="Sub Port" initialValue={2096}>
              <InputNumber min={1} max={65535} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="location" label="Локация">
              <Input placeholder="Netherlands" />
            </Form.Item>
            <Form.Item name="country" label="Страна (ISO2)">
              <Input placeholder="NL" maxLength={2} />
            </Form.Item>
            <Form.Item name="flag" label="Флаг">
              <Input placeholder="🇳🇱" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="inbound_id" label="Inbound ID" initialValue={1}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="protocol" label="Протокол" initialValue="vless">
              <Select>
                <Select.Option value="vless">VLESS</Select.Option>
                <Select.Option value="trojan">Trojan</Select.Option>
                <Select.Option value="shadowsocks">Shadowsocks</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="max_clients" label="Макс. клиентов" initialValue={200}>
              <InputNumber min={1} />
            </Form.Item>
          </Space>
          <Form.Item name="xui_url" label="XUI URL (если отличается от host)">
            <Input placeholder="Оставьте пустым если host = xui_url" />
          </Form.Item>
          <Form.Item name="xui_username" label="XUI Username">
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item name="xui_password" label="XUI Password">
            <Input.Password placeholder="Оставьте пустым если не меняется" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
