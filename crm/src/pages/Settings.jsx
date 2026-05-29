import { useEffect, useState } from 'react'
import {
  Typography, Switch, Select, message, Spin, Tabs, Table, Button, Modal,
  Form, Input, InputNumber, Tag, Space, Popconfirm, Tooltip,
} from 'antd'
import {
  SettingOutlined, GlobalOutlined, MobileOutlined, LockOutlined,
  PlusOutlined, DeleteOutlined, ReloadOutlined, ApiOutlined,
  CloudServerOutlined, KeyOutlined, ToolOutlined, ThunderboltOutlined,
  CloudOutlined, FlagOutlined, NodeIndexOutlined,
} from '@ant-design/icons'
import api, { apiJson } from '../api'

const { Title, Text } = Typography

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [langs, setLangs] = useState(['ru'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [tab, setTab] = useState('system')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/settings'),
      api.get('/public/langs'),
    ]).then(([s, l]) => {
      const obj = {}
      for (const row of s.data) obj[row.key] = row.value
      setSettings(obj)
      setLangs(l.data)
    }).finally(() => setLoading(false))
  }, [])

  async function toggle(key) {
    setSaving(key)
    const newValue = settings[key] === '1' ? '0' : '1'
    try {
      const { data } = await api.put('/admin/settings', { [key]: newValue })
      const obj = {}
      for (const row of data) obj[row.key] = row.value
      setSettings(obj)
      message.success('Сохранено')
    } catch {
      message.error('Ошибка')
    }
    setSaving(null)
  }

  async function saveLang(value) {
    try {
      await api.put('/admin/settings', { lang: value })
      setSettings(prev => ({ ...prev, lang: value }))
      message.success('Язык сохранён')
    } catch {
      message.error('Ошибка')
    }
  }

  const tabItems = [
    { key: 'system', label: <span><SettingOutlined /> Системные</span>, children: <SystemTab settings={settings} langs={langs} saving={saving} toggle={toggle} saveLang={saveLang} /> },
    { key: 'nodes', label: <span><CloudServerOutlined /> Ноды</span>, children: <NodesTab /> },
    { key: 'ssh', label: <span><ToolOutlined /> SSH</span>, children: <SshTab /> },
    { key: 'logic', label: <span><NodeIndexOutlined /> Логика</span>, children: <LogicTab /> },
    { key: 'appearance', label: <span><FlagOutlined /> Оформление</span>, children: <AppearanceTab /> },
  ]

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>
          <SettingOutlined />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>Настройки системы</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Управление серверами, нодами и конфигурацией</Text>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
        <Tabs activeKey={tab} onChange={setTab} items={tabItems} style={{ padding: '0 24px' }} />
      </div>
    </div>
  )
}

// ─── System Tab ───────────────────────────────────────────────────────────
function SystemTab({ settings, langs, saving, toggle, saveLang }) {
  return (
    <div style={{ maxWidth: 720 }}>
      {/* Language */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <GlobalOutlined style={{ color: '#8b5cf6' }} />
          <Text strong>Язык по умолчанию</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
          Язык интерфейса для сайта и приложения для новых пользователей
        </Text>
        <Select
          value={settings?.lang || 'ru'}
          onChange={saveLang}
          style={{ width: 200 }}
          options={langs.map(l => ({ value: l, label: l === 'ru' ? 'Русский' : l === 'en' ? 'English' : l }))}
        />
      </div>

      {/* Maintenance App */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <MobileOutlined style={{ color: '#059669' }} />
            <Text strong>Режим обслуживания (app.cwim.ru)</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>При включении приложение показывает заглушку</Text>
        </div>
        <Switch
          checked={settings?.maintenance_app === '1'}
          onChange={() => toggle('maintenance_app')}
          loading={saving === 'maintenance_app'}
        />
      </div>

      {/* Maintenance Site */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <GlobalOutlined style={{ color: '#d97706' }} />
            <Text strong>Режим обслуживания (vpn.cwim.ru)</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>При включении сайт показывает заглушку</Text>
        </div>
        <Switch
          checked={settings?.maintenance_site === '1'}
          onChange={() => toggle('maintenance_site')}
          loading={saving === 'maintenance_site'}
        />
      </div>

      {/* IP Whitelist */}
      <div style={{ padding: '20px 0' }}>
        <IpWhitelistSection />
      </div>
    </div>
  )
}

// ─── IP Whitelist (inline) ────────────────────────────────────────────────
function IpWhitelistSection() {
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
      setNewIp(''); setNewComment('')
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
    { title: 'IP-адрес', dataIndex: 'ip_address', width: 160 },
    { title: 'Комментарий', dataIndex: 'comment', render: (v) => v || <Text type="secondary">—</Text> },
    { title: 'Статус', dataIndex: 'is_active', width: 90, render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активен' : 'Выкл'}</Tag> },
    { title: 'Дата', dataIndex: 'created_at', width: 150, render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      title: '', key: 'actions', width: 50,
      render: (_, r) => (
        <Popconfirm title="Удалить IP?" onConfirm={() => handleDelete(r.id)} okText="Да" cancelText="Нет">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LockOutlined style={{ color: '#8b5cf6' }} />
          <Text strong>IP Whitelist</Text>
        </div>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          Добавить IP
        </Button>
      </div>
      <Table dataSource={list} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />
      <Modal title="Добавить IP-адрес" open={addOpen} onCancel={() => { setAddOpen(false); setNewIp(''); setNewComment('') }}
        onOk={handleAdd} okText="Добавить" cancelText="Отмена" destroyOnClose>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
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

// ─── Nodes Tab ────────────────────────────────────────────────────────────
function NodesTab() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [testing, setTesting] = useState(null)
  const [restarting, setRestarting] = useState(null)
  const [cleaning, setCleaning] = useState(null)
  const [fetchingInbounds, setFetchingInbounds] = useState(null)
  const [inboundsModal, setInboundsModal] = useState(null)
  const [form] = Form.useForm()

  async function fetch() {
    setLoading(true)
    try {
      const data = await apiJson('/admin/servers')
      setServers(data)
    } catch (err) { message.error(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ port: 443, sub_port: 2096, inbound_id: 1, max_clients: 200, protocol: 'vless' })
    setModalOpen(true)
  }

  function openEdit(r) {
    setEditing(r)
    const vals = { ...r }
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
        message.success('Нода обновлена')
      } else {
        await apiJson('/admin/servers', { method: 'POST', body: JSON.stringify(cleaned) })
        message.success('Нода создана')
      }
      setModalOpen(false)
      fetch()
    } catch (err) { message.error(err.message) }
  }

  async function handleDelete(id) {
    Modal.confirm({
      title: 'Удалить ноду?', content: 'Это действие необратимо.', okText: 'Удалить', okType: 'danger', cancelText: 'Отмена',
      onOk: async () => {
        try { await apiJson(`/admin/servers/${id}`, { method: 'DELETE' }); message.success('Нода удалена'); fetch() }
        catch (err) { message.error(err.message) }
      },
    })
  }

  async function handleTest(id) {
    setTesting(id)
    try {
      const r = await apiJson(`/admin/servers/${id}/test`)
      if (r.success) message.success(r.message || 'Подключение успешно')
      else message.error(r.message || 'Ошибка подключения')
    } catch (err) { message.error(err.message) } finally { setTesting(null) }
  }

  async function handleRestartXray(id) {
    setRestarting(id)
    try {
      const r = await apiJson(`/admin/servers/${id}/restart-xray`)
      if (r.success) message.success(r.message || 'Xray перезапущен')
      else message.error(r.message || 'Ошибка')
    } catch (err) { message.error(err.message) } finally { setRestarting(null) }
  }

  async function handleClean(id) {
    setCleaning(id)
    try {
      await apiJson(`/admin/servers/${id}/clean-depleted`, { method: 'POST' })
      message.success('Неактивные клиенты удалены')
    } catch (err) { message.error(err.message) } finally { setCleaning(null) }
  }

  async function handleFetchInbounds(id) {
    setFetchingInbounds(id)
    try {
      const r = await apiJson(`/admin/servers/${id}/fetch-inbounds`)
      if (r.success) setInboundsModal({ serverId: id, inbounds: r.inbounds })
      else message.error(r.message || 'Ошибка')
    } catch (err) { message.error(err.message) } finally { setFetchingInbounds(null) }
  }

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

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: 'Название', dataIndex: 'name', key: 'name', render: (v, r) => <>{r.flag || ''} {v}</> },
    { title: 'URL ноды', dataIndex: 'xui_url', key: 'xui_url', ellipsis: true, render: (v, r) => v || `${r.host}:${r.port}` },
    {
      title: 'Аутентификация', key: 'auth', width: 100,
      render: (_, r) => r.xui_has_token
        ? <Tag color="purple" icon={<KeyOutlined />}>API Token</Tag>
        : <Tag>Логин/Пароль</Tag>,
    },
    { title: 'Inbound', dataIndex: 'inbound_id', key: 'inbound_id', width: 65 },
    { title: 'Протокол', dataIndex: 'protocol', key: 'protocol', width: 80 },
    { title: 'Клиенты', key: 'clients', width: 70, render: (_, r) => `${r.current_clients}/${r.max_clients}` },
    {
      title: 'Статус', key: 'status', width: 100,
      render: (_, r) => (
        <Space>
          <Tag color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Активен' : 'Нет'}</Tag>
          <Tag color={r.is_online ? 'blue' : 'default'}>{r.is_online ? 'Online' : 'Offline'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Действия', key: 'actions', width: 350,
      render: (_, r) => (
        <Space size="small" wrap>
          <Tooltip title="Проверить подключение"><Button size="small" icon={<ApiOutlined />} loading={testing === r.id} onClick={() => handleTest(r.id)} /></Tooltip>
          <Tooltip title="Перезапустить Xray"><Button size="small" icon={<ThunderboltOutlined />} loading={restarting === r.id} onClick={() => handleRestartXray(r.id)} /></Tooltip>
          <Tooltip title="Список инбаундов"><Button size="small" loading={fetchingInbounds === r.id} onClick={() => handleFetchInbounds(r.id)}>IB</Button></Tooltip>
          <Button size="small" loading={cleaning === r.id} onClick={() => handleClean(r.id)}>Clean</Button>
          <Button size="small" onClick={() => openEdit(r)}>Ред.</Button>
          <Button size="small" danger onClick={() => handleDelete(r.id)}>Уд.</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
        <Text>Управление 3X-UI нодами. <KeyOutlined /> API Token — приоритетный способ подключения.</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Добавить ноду</Button>
      </div>

      <Table dataSource={servers} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} scroll={{ x: 1200 }} />

      <Modal title={editing ? 'Редактировать ноду' : 'Новая нода 3X-UI'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave}
        okText={editing ? 'Сохранить' : 'Создать'} cancelText="Отмена" width={700}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Название ноды" rules={[{ required: true }]}>
            <Input placeholder="NL-01, DE-01, ..." />
          </Form.Item>

          <Form.Item name="xui_url" label="URL панели 3X-UI" rules={[{ required: true, message: 'Введите URL панели' }]}
            help="Полный URL: https://ip:порт/путь (если есть) или просто ip:порт">
            <Input placeholder="https://192.168.1.1:17166/abc123 или 192.168.1.1:17166" />
          </Form.Item>

          <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8, color: '#8b5cf6' }}>
              <KeyOutlined /> Аутентификация — API Token (приоритет)
            </Text>
            <Form.Item name="xui_api_token" label="API Token"
              help={editing ? 'Оставьте пустым, чтобы не менять' : 'Из Settings → Security → API Token панели 3X-UI'}>
              <Input.Password placeholder={editing
                ? (editing.xui_has_token ? '✅ Токен установлен · оставьте пустым' : 'Введите новый API Token')
                : 'Введите API Token из панели 3X-UI'
              } />
            </Form.Item>

            <details style={{ cursor: 'pointer', marginTop: 8 }}>
              <summary style={{ color: '#888', fontSize: 13 }}>Логин/пароль (если нет токена)</summary>
              <Space style={{ width: '100%', marginTop: 8 }} size={16}>
                <Form.Item name="xui_username" label="Username" style={{ flex: 1 }}>
                  <Input placeholder="admin" />
                </Form.Item>
                <Form.Item name="xui_password" label="Password" style={{ flex: 1 }}>
                  <Input.Password placeholder="Оставьте пустым, если не меняется" />
                </Form.Item>
              </Space>
            </details>
          </div>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="location" label="Локация" style={{ flex: 1 }}>
              <Select placeholder="Выберите страну" allowClear options={availableLocs} />
            </Form.Item>
            <Form.Item name="country" label="ISO2" style={{ width: 80 }}>
              <Input placeholder="NL" maxLength={2} />
            </Form.Item>
            <Form.Item name="flag" label="Флаг" style={{ width: 80 }}>
              <Input placeholder="🇳🇱" />
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
        </Form>
      </Modal>

      <Modal title="Инбаунды ноды" open={!!inboundsModal} onCancel={() => setInboundsModal(null)}
        footer={<Button onClick={() => setInboundsModal(null)}>Закрыть</Button>} width={800}>
        {inboundsModal && (
          <Table dataSource={inboundsModal.inbounds} rowKey="id" pagination={false}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 60 },
              { title: 'Remark', dataIndex: 'remark' },
              { title: 'Порт', dataIndex: 'port', width: 80 },
              { title: 'Протокол', dataIndex: 'protocol', width: 100 },
              { title: 'Клиентов', key: 'clients', width: 80, render: (_, r) => r.clientStats?.length || 0 },
              { title: 'Статус', width: 70, render: (_, r) => <Tag color={r.enable ? 'green' : 'red'}>{r.enable ? 'On' : 'Off'}</Tag> },
              { title: 'Трафик up/down', width: 170, render: (_, r) => `${fmtBytes(r.up)} / ${fmtBytes(r.down)}` },
            ]}
            scroll={{ x: 700 }}
          />
        )}
      </Modal>
    </div>
  )
}

// ─── SSH Tab ──────────────────────────────────────────────────────────────
function SshTab() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [installing, setInstalling] = useState(null)
  const [form] = Form.useForm()

  async function fetch() {
    setLoading(true)
    try { setServers(await apiJson('/admin/servers')) } catch (err) { message.error(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  function openEdit(r) { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  async function handleSave() {
    const values = await form.validateFields()
    try {
      await apiJson(`/admin/servers/${editing.id}`, { method: 'PUT', body: JSON.stringify(values) })
      message.success('SSH настройки сохранены')
      setModalOpen(false)
      fetch()
    } catch (err) { message.error(err.message) }
  }

  async function installSpeedtest(id) {
    setInstalling(id)
    try {
      const r = await apiJson(`/admin/servers/${id}/install-speedtest`, { method: 'POST' })
      message.success('Speedtest установлен')
      Modal.info({ title: 'Результат', content: <pre style={{ fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{r.output || 'OK'}</pre> })
    } catch (err) { message.error(err.message) } finally { setInstalling(null) }
  }

  const columns = [
    { title: 'Сервер', dataIndex: 'name', key: 'name' },
    { title: 'SSH Host', dataIndex: 'ssh_host', key: 'ssh_host', render: (v) => v || <Text type="secondary">—</Text> },
    { title: 'Порт', dataIndex: 'ssh_port', key: 'ssh_port', width: 70 },
    { title: 'User', dataIndex: 'ssh_username', key: 'ssh_username', width: 100, render: (v) => v || <Text type="secondary">—</Text> },
    {
      title: 'Статус', key: 'status', width: 100,
      render: (_, r) => r.ssh_host ? <Tag color="green">Настроен</Tag> : <Tag>Не настроен</Tag>,
    },
    {
      title: 'Speedtest', key: 'speedtest', width: 140,
      render: (_, r) => (
        <Button size="small" disabled={!r.ssh_host} loading={installing === r.id} onClick={() => installSpeedtest(r.id)}>
          Установить
        </Button>
      ),
    },
    {
      title: 'Действия', key: 'actions', width: 80,
      render: (_, r) => <Button size="small" onClick={() => openEdit(r)}>Настроить</Button>,
    },
  ]

  return (
    <div>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Text>Настройка SSH доступа для установки speedtest-cli и диагностики</Text>
      </div>
      <Table dataSource={servers} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />

      <Modal title={`SSH — ${editing?.name || ''}`} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} okText="Сохранить" cancelText="Отмена" width={520}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="ssh_host" label="SSH Host" style={{ flex: 1 }}>
              <Input placeholder="IP или домен" />
            </Form.Item>
            <Form.Item name="ssh_port" label="SSH Port" initialValue={22}>
              <InputNumber min={1} max={65535} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="ssh_username" label="SSH Username" style={{ flex: 1 }}>
              <Input placeholder="root" />
            </Form.Item>
            <Form.Item name="ssh_password" label="SSH Password" style={{ flex: 1 }}>
              <Input.Password placeholder="Пароль" />
            </Form.Item>
          </Space>
          <Form.Item name="ssh_key" label="SSH Private Key (опционально)">
            <Input.TextArea rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\n..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ─── Logic Tab ────────────────────────────────────────────────────────────
function LogicTab() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  async function fetch() {
    setLoading(true)
    try { setServers(await apiJson('/admin/servers')) } catch (err) { message.error(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  async function toggleDedicated(id, current) {
    setToggling(id)
    try {
      await apiJson(`/admin/servers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_dedicated: !current }),
      })
      message.success('Обновлено')
      fetch()
    } catch (err) { message.error(err.message) } finally { setToggling(null) }
  }

  const columns = [
    { title: 'Сервер', dataIndex: 'name', key: 'name', render: (v, r) => <>{r.flag || ''} {v}</> },
    { title: 'Хост', dataIndex: 'host', key: 'host' },
    {
      title: 'Тип', key: 'type', width: 160,
      render: (_, r) => (
        <Tag color={r.is_dedicated ? 'purple' : 'blue'}>{r.is_dedicated ? 'Выделенный' : 'Общий'}</Tag>
      ),
    },
    {
      title: 'Действие', key: 'action', width: 200,
      render: (_, r) => (
        <Button
          size="small"
          loading={toggling === r.id}
          onClick={() => toggleDedicated(r.id, r.is_dedicated)}
        >
          {r.is_dedicated ? 'Сделать общим' : 'Сделать выделенным'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Text>
          <strong>Общий сервер</strong> — клиенты подключаются к мультиподписке (sub.cwim.ru).<br />
          <strong>Выделенный сервер</strong> — исключается из мультиподписки, используется для персональных серверов клиентов.
        </Text>
      </div>
      <Table dataSource={servers} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />
    </div>
  )
}

// ─── Appearance Tab ──────────────────────────────────────────────────────
function AppearanceTab() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  async function fetch() {
    setLoading(true)
    try { setServers(await apiJson('/admin/servers')) } catch (err) { message.error(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  function openEdit(r) { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  async function handleSave() {
    const values = await form.validateFields()
    try {
      await apiJson(`/admin/servers/${editing.id}`, { method: 'PUT', body: JSON.stringify(values) })
      message.success('Оформление сохранено')
      setModalOpen(false)
      fetch()
    } catch (err) { message.error(err.message) }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: 'Флаг', dataIndex: 'flag', key: 'flag', width: 60, render: (v) => <span style={{ fontSize: 20 }}>{v || '🌐'}</span> },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Локация', dataIndex: 'location', key: 'location', render: (v) => v || <Text type="secondary">—</Text> },
    { title: 'Страна', dataIndex: 'country', key: 'country', width: 80, render: (v) => v || '—' },
    { title: 'Хост', dataIndex: 'host', key: 'host' },
    {
      title: 'Действия', key: 'actions', width: 100,
      render: (_, r) => <Button size="small" onClick={() => openEdit(r)}>Редакт.</Button>,
    },
  ]

  return (
    <div>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Text>Настройка отображения серверов: иконки, названия, локации — всё что видят пользователи</Text>
      </div>
      <Table dataSource={servers} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />

      <Modal title={`Оформление — ${editing?.name || ''}`} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} okText="Сохранить" cancelText="Отмена" width={520}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Название сервера" rules={[{ required: true }]}>
            <Input placeholder="Netherlands" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="flag" label="Флаг (эмодзи)">
              <Input placeholder="🇳🇱" />
            </Form.Item>
            <Form.Item name="country" label="Страна (ISO2)">
              <Input placeholder="NL" maxLength={2} />
            </Form.Item>
          </Space>
          <Form.Item name="location" label="Город / Локация">
            <Input placeholder="Amsterdam" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
