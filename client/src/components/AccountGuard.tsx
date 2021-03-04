import { lazy, Suspense } from 'react'
import { foldLocation, Router } from '../contexts/Router'
import { SpinBlock } from './SpinBlock/SpinBlock'
import { Layout } from 'antd'
import { flow, pipe } from 'fp-ts/function'
import { Menu } from './Menu'
import { foldAccount, useAccount } from '../contexts/Account/Account'
import { LoginPage } from './Login/LoginPage'

const HomePage = lazy(() => import('./Home/HomePage'))
const ProfilePage = lazy(() => import('./Profile/ProfilePage'))

export function AccountGuard() {
  const { account } = useAccount()

  return pipe(
    account,
    foldAccount(
      () => <LoginPage />,
      () => (
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
    )
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
