import 'antd/dist/antd.css'
import { lazy, Suspense } from 'react'
import { foldLocation, Router } from './components/Router'
import { SpinBlock } from './components/SpinBlock/SpinBlock'
import { Layout } from 'antd'
import { Menu } from './components/Menu'
import { flow } from 'fp-ts/function'

const HomePage = lazy(() => import('./components/Home/HomePage'))
const ProfilePage = lazy(() => import('./components/Profile/ProfilePage'))

function App() {
  return (
    <Layout.Content>
      <Suspense fallback={<SpinBlock />}>
        <Router
          render={flow(
            foldLocation({
              Home: () => <HomePage />,
              Profile: () => <ProfilePage />
            }),
            renderPage
          )}
        />
      </Suspense>
    </Layout.Content>
  )
}

function renderPage(content: JSX.Element) {
  return (
    <div className="Page">
      <Menu />
      {content}
    </div>
  )
}

export default App
