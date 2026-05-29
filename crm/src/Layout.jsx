import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Typography } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  LogoutOutlined,
  CrownOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

const { Sider, Content, Header } = AntLayout
const { Text } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/users', icon: <TeamOutlined />, label: 'Пользователи' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Заказы' },
  { key: '/admins', icon: <CrownOutlined />, label: 'Администраторы' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKey = '/' + location.pathname.split('/')[1]

  const dropdownItems = [
    { key: 'profile', icon: <UserOutlined />, label: admin?.email },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={56}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontWeight: 700,
          fontSize: collapsed ? 14 : 18,
          letterSpacing: '0.05em',
          color: '#fff',
        }}>
          {collapsed ? 'C' : 'CWIM CRM'}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: 4 }}
        />
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? 56 : 220, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          borderBottom: '1px solid #f0f0f0',
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Dropdown
            menu={{
              items: dropdownItems,
              onClick: ({ key }) => {
                if (key === 'logout') {
                  logout()
                  navigate('/')
                }
              },
            }}
            placement="bottomRight"
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>{admin?.email}</Text>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
            </div>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
