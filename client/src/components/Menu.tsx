import { Layout, Menu as AntdMenu } from 'antd'
import { home, profile, useRouter } from '../contexts/Router'
import { MenuInfo } from 'rc-menu/lib/interface'

export function Menu() {
  const { location, setLocation } = useRouter()

  const onMenuClick = (e: MenuInfo) => {
    switch (e.key) {
      case 'Home':
        setLocation(home())
        break
      case 'Profile':
        setLocation(profile())
        break
      default:
        break
    }
  }

  return (
    <Layout.Header>
      <AntdMenu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={[location._tag]}
        onClick={onMenuClick}
      >
        <AntdMenu.Item key={home()._tag}>Home</AntdMenu.Item>
        <AntdMenu.Item key={profile()._tag}>Profile</AntdMenu.Item>
      </AntdMenu>
    </Layout.Header>
  )
}
