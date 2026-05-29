import { Button, Form, Input, Typography, Card, Alert, Space } from 'antd'
import { LockOutlined, MailOutlined, CrownOutlined } from '@ant-design/icons'
import { useAuth } from '../AuthContext'
import { useState } from 'react'

const { Title, Text } = Typography

export default function AuthPage() {
  const { hasAdmins, login, register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isRegister = !hasAdmins

  async function onFinish(values) {
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        await register(values.email, values.password)
      } else {
        await login(values.email, values.password)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: 16,
    }}>
      <Card style={{ width: 400, maxWidth: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <CrownOutlined style={{ fontSize: 40, color: '#1677ff' }} />
            <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>CWIM CRM</Title>
            <Text type="secondary">
              {isRegister ? 'Создание первого администратора' : 'Вход в панель управления'}
            </Text>
          </div>

          {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />}

          <Form layout="vertical" onFinish={onFinish} autoComplete="off" style={{ textAlign: 'left' }}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Введите email' },
                { type: 'email', message: 'Некорректный email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="admin@example.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Пароль"
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                {isRegister ? 'Создать аккаунт' : 'Войти'}
              </Button>
            </Form.Item>
          </Form>

          {isRegister && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Вы создаёте root-администратора. После регистрации вы сможете добавлять других администраторов.
            </Text>
          )}
        </Space>
      </Card>
    </div>
  )
}
