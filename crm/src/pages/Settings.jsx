import { useEffect, useState } from 'react'
import { Typography, Switch, Select, message, Spin } from 'antd'
import {
  SettingOutlined, GlobalOutlined, MobileOutlined,
} from '@ant-design/icons'
import api from '../api'

const { Title, Text } = Typography

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [langs, setLangs] = useState(['ru'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
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
      message.success('Сохранено')
    } catch {
      message.error('Ошибка')
    }
  }

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>
          <SettingOutlined />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>Настройки системы</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Управление конфигурацией сервиса</Text>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlobalOutlined style={{ color: '#8b5cf6' }} />
            <Text strong style={{ fontSize: 15 }}>Общие</Text>
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text strong>Язык по умолчанию</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>Язык интерфейса для новых пользователей приложения</Text>
          </div>
          <Select
            value={settings?.lang || 'ru'}
            onChange={saveLang}
            style={{ width: 160 }}
            options={langs.map(l => ({ value: l, label: l === 'ru' ? 'Русский' : l === 'en' ? 'English' : l }))}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden', marginTop: 16 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MobileOutlined style={{ color: '#059669' }} />
            <Text strong style={{ fontSize: 15 }}>Приложение (app.cwim.ru)</Text>
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text strong>Режим обслуживания</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>При включении приложение показывает заглушку и перестаёт работать</Text>
          </div>
          <Switch
            checked={settings?.maintenance_app === '1'}
            onChange={() => toggle('maintenance_app')}
            loading={saving === 'maintenance_app'}
          />
        </div>
      </div>
    </div>
  )
}
