import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Typography, Tooltip, Divider } from 'antd'
import { PlusOutlined, ReloadOutlined, ApiOutlined, ThunderboltOutlined, KeyOutlined, LinkOutlined } from '@ant-design/icons'
import { apiJson } from '../api'

const { Title, Text } = Typography

export default function Servers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [testing, setTesting] = useState(null)
  const [restarting, setRestarting] = useState(null)
  const [fetchingInbounds, setFetchingInbounds] = useState(null)
  const [inboundsModal, setInboundsModal] = useState(null)
  const [form] = Form.useForm()

  const availableLocs = [
    { label: '🇳🇱 Netherlands', value: 'NL' },
    { label: '🇩🇪 Germany', value: 'DE' },
    { label: '🇺🇸 USA', value: 'US' },
    { label: '🇫🇷 France', value: 'FR' },
    { label: '🇬🇧 UK', value: 'GB' },
    { label: '🇨🇦 Canada', value: 'CA' },
    { label: '🇸🇬 Singapore', value: 'SG' },
    { label: '🇯🇵 Japan', value: 'JP' },
    { label: '🇫🇮 Finland', value: 'FI' },
    { label: '🇺🇦 Ukraine', value: 'UA' },
  ]

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
    form.setFieldsValue({ port: 443, sub_port: 2096, inbound_id: 1, max_clients: 200, protocol: 'vless' })
    setModalOpen(true)
  }

  function openEdit(record) {
    setEditing(record)
    const vals = { ...record, country: record.country || undefined }
    delete vals.id
    delete vals.xui_has_token
    delete vals.created_at
    delete vals.updated_at
    delete vals.is_online
    delete vals.current_clients
    form.setFieldsValue(vals)
    setModalOpen(true)
  }

  async function handleSave() {
    const values = await form.validateFields()
    const cleaned = {}
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined && v !== null && v !== '') cleaned[k] = v
    }
    try {
      if (editing) {
        await apiJson(`/admin/servers/${editing.id}`, { method: 'PUT', body: JSON.stringify(cleaned) })
        message.success('Сервер обновлён')
      } else {
        await apiJson('/admin/servers', { method: 'POST', body: JSON.stringify(cleaned) })
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
      okText: 'Удалить', okType: 'danger', cancelText: 'Отмена',
      onOk: async () => {
        try {
          await apiJson(`/admin/servers/${id}`, { method: 'DELETE' })
          message.success('Сервер удалён')
          fetchServers()
        } catch (err) { message.error(err.message) }
      },
    })
  }

  async function handleTest(id) {
    setTesting(id)
    try {
      const result = await apiJson(`/admin/servers/${id}/test`)
      if (result.success) message.success(result.message || 'Подключение успешно')
      else message.error(result.message || 'Ошибка подключения')
    } catch (err) { message.error(err.message) }
    finally { setTesting(null) }
  }

  async function handleRestartXray(id) {
    setRestarting(id)
    try {
      const result = await apiJson(`/admin/servers/${id}/restart-xray`)
      if (result.success) message.success(result.message || 'Xray перезапущен')
      else message.error(result.message || 'Ошибка перезапуска')
    } catch (err) { message.error(err.message) }
    finally { setRestarting(null) }
  }

  async function handleFetchInbounds(id) {
    setFetchingInbounds(id)
    try {
      const result = await apiJson(`/admin/servers/${id}/fetch-inbounds`)
      if (result.success) setInboundsModal({ serverId: id, inbounds: result.inbounds })
      else message.error(result.message || 'Ошибка получения инбаундов')
    } catch (err) { message.error(err.message) }
    finally { setFetchingInbounds(null) }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'URL ноды', dataIndex: 'xui_url', key: 'xui_url', ellipsis: true, render: (v, r) => v || `${r.host}:${r.port}` },
    {
      title: 'Аутентификация', key: 'auth', width: 110,
      render: (_, r) => r.xui_has_token
        ? <Tag color="purple" icon={<KeyOutlined />}>API Token</Tag>
        : <Tag>Логин/Пароль</Tag>,
    },
    {
      title: 'Статус', key: 'status', width: 130,
      render: (_, r) => (
        <Space>
          <Tag color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Активен' : 'Неактивен'}</Tag>
          <Tag color={r.is_online ? 'blue' : 'default'}>{r.is_online ? 'Online' : 'Offline'}</Tag>
        </Space>
      ),
    },
    { title: 'Клиенты', key: 'clients', width: 90, render: (_, r) => `${r.current_clients}/${r.max_clients}` },
    { title: 'Inbound', dataIndex: 'inbound_id', key: 'inbound_id', width: 75 },
    { title: 'Протокол', dataIndex: 'protocol', key: 'protocol', width: 100 },
    { title: 'Локация', dataIndex: 'location', key: 'location', width: 100 },
    {
      title: 'Действия', key: 'actions', width: 310,
      render: (_, r) => (
        <Space size="small" wrap>
          <Tooltip title="Проверить подключение"><Button size="small" icon={<ApiOutlined />} loading={testing === r.id} onClick={() => handleTest(r.id)} /></Tooltip>
          <Tooltip title="Перезапустить Xray"><Button size="small" icon={<ThunderboltOutlined />} loading={restarting === r.id} onClick={() => handleRestartXray(r.id)} /></Tooltip>
          <Tooltip title="Список инбаундов"><Button size="small" loading={fetchingInbounds === r.id} onClick={() => handleFetchInbounds(r.id)}>Inbounds</Button></Tooltip>
          <Button size="small" onClick={() => openEdit(r)}>Ред.</Button>
          <Button size="small" danger onClick={() => handleDelete(r.id)}>Уд.</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Серверы (ноды 3X-UI)</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchServers}>Обновить</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Добавить ноду</Button>
        </Space>
      </div>

      <Table dataSource={servers} columns={columns} rowKey="id" loading={loading} scroll={{ x: 1400 }} pagination={false} />

      <Modal
        title={editing ? 'Редактировать ноду' : 'Новая нода 3X-UI'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Название ноды" rules={[{ required: true }]}>
            <Input placeholder="NL-01, DE-01, ..." />
          </Form.Item>

          <Form.Item name="xui_url" label="URL панели 3X-UI"
            rules={[{ required: true, message: 'Введите URL панели' }]}
            help="Полный URL: https://ip:порт/путь (если есть) или просто ip:порт"
          >
            <Input placeholder="https://192.168.1.1:17166/abc123 или 192.168.1.1:17166" />
          </Form.Item>

          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            <KeyOutlined /> API Token — приоритетный способ.
            {editing && ' Оставьте пустым, чтобы не менять.'}
          </Text>

          <Form.Item name="xui_api_token" label="API Token">
            <Input.Password
              placeholder={editing
                ? (editing.xui_has_token ? 'Токен установлен · оставьте пустым чтобы не менять' : 'Введите новый API Token')
                : 'Из Settings → Security → API Token панели 3X-UI'
              }
            />
          </Form.Item>

          {editing && editing.xui_has_token && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, marginTop: -12 }}>
              ✅ Токен уже установлен. Заполните поле выше для замены.
            </Text>
          )}

          <details style={{ marginBottom: 12, cursor: 'pointer' }}>
            <summary style={{ color: '#888' }}>Логин/пароль (если нет токена)</summary>
            <Space style={{ width: '100%', marginTop: 8 }} size={16}>
              <Form.Item name="xui_username" label="Username" style={{ flex: 1 }}>
                <Input placeholder="admin" />
              </Form.Item>
              <Form.Item name="xui_password" label="Password" style={{ flex: 1 }}>
                <Input.Password placeholder="Оставьте пустым, если не меняется" />
              </Form.Item>
            </Space>
          </details>

          <Divider style={{ margin: '12px 0' }} />

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="location" label="Локация" style={{ flex: 1 }}>
              <Select placeholder="Выберите страну" allowClear options={availableLocs} />
            </Form.Item>
            <Form.Item name="country" label="ISO2" style={{ width: 80 }}>
              <Input placeholder="NL" maxLength={2} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="sub_port" label="Sub Port" initialValue={2096}>
              <InputNumber min={1} max={65535} />
            </Form.Item>
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

          <details style={{ cursor: 'pointer' }}>
            <summary style={{ color: '#888' }}>Дополнительные настройки</summary>
            <Space style={{ width: '100%', marginTop: 8 }} size={16}>
              <Form.Item name="port" label="Порт панели" initialValue={443}>
                <InputNumber min={1} max={65535} />
              </Form.Item>
              <Form.Item name="flag" label="Флаг">
                <Input placeholder="🇳🇱" />
              </Form.Item>
            </Space>
          </details>
        </Form>
      </Modal>

      <Modal
        title="Инбаунды ноды"
        open={!!inboundsModal}
        onCancel={() => setInboundsModal(null)}
        footer={<Button onClick={() => setInboundsModal(null)}>Закрыть</Button>}
        width={850}
      >
        {inboundsModal && (
          <Table
            dataSource={inboundsModal.inbounds}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 60 },
              { title: 'Remark', dataIndex: 'remark' },
              { title: 'Порт', dataIndex: 'port', width: 80 },
              { title: 'Протокол', dataIndex: 'protocol', width: 100 },
              { title: 'Клиентов', key: 'clients', width: 100, render: (_, r) => r.clientStats?.length || 0 },
              { title: 'Статус', width: 80, render: (_, r) => <Tag color={r.enable ? 'green' : 'red'}>{r.enable ? 'On' : 'Off'}</Tag> },
              { title: 'Трафик up/down', width: 180, render: (_, r) => `${fmtBytes(r.up)} / ${fmtBytes(r.down)}` },
              { title: 'Tag', dataIndex: 'tag', ellipsis: true },
            ]}
            scroll={{ x: 800 }}
          />
        )}
      </Modal>
    </div>
  )
}

function fmtBytes(bytes) {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0, v = bytes
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${u[i]}`
}
