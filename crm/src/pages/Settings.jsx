import { useEffect, useState } from 'react'
import { Card, Typography, Switch, message, Spin } from 'antd'
import {
  SettingOutlined, GlobalOutlined, MobileOutlined,
} from '@ant-design/icons'
import api from '../api'

const { Title, Text } = Typography

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings(data))
      .finally(() => setLoading(false))
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

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <SettingOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />
        <Title level={4} style={{ margin: 0 }}>Настройки</Title>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GlobalOutlined style={{ color: '#2563eb' }} />
              <span>Лендинг (vpn.cwim.ru)</span>
            </div>
          }
          style={{ flex: 1, minWidth: 300, borderRadius: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong>Режим обслуживания</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>При включении сайт показывает страницу о технических работах</Text>
            </div>
            <Switch
              checked={settings?.maintenance_site === '1'}
              onChange={() => toggle('maintenance_site')}
              loading={saving === 'maintenance_site'}
            />
          </div>
        </Card>

        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MobileOutlined style={{ color: '#059669' }} />
              <span>Приложение (app.cwim.ru)</span>
            </div>
          }
          style={{ flex: 1, minWidth: 300, borderRadius: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong>Режим обслуживания</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>При включении приложение показывает заглушку и не работает</Text>
            </div>
            <Switch
              checked={settings?.maintenance_app === '1'}
              onChange={() => toggle('maintenance_app')}
              loading={saving === 'maintenance_app'}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
