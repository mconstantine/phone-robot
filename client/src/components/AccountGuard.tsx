import { lazy, Suspense } from 'react'
import { foldLocation, Router } from '../contexts/Router'
import { SpinBlock } from './SpinBlock/SpinBlock'
import { flow, pipe } from 'fp-ts/function'
import { Menu } from './Menu'
import { foldAccount, useAccount } from '../contexts/Account/Account'
import { LoginPage } from './Login/LoginPage'
import { WebSocketProvider } from '../contexts/WebSocket/WebSocket'
import { NetworkProvider } from '../contexts/Network/Network'

const HomePage = lazy(() => import('./Home/HomePage'))
const ProfilePage = lazy(() => import('./Profile/ProfilePage/ProfilePage'))
const UsersPage = lazy(() => import('./Users/UsersPage'))

export function AccountGuard() {
  const { account } = useAccount()

  return pipe(
    account,
    foldAccount(
      () => (
        <div className="Page">
          <LoginPage />
        </div>
      ),
      () => (
        <Suspense fallback={<SpinBlock />}>
          <Router
            render={flow(
              foldLocation({
                Home: () => (
                  <WebSocketProvider>
                    <NetworkProvider>
                      <HomePage />
                    </NetworkProvider>
                  </WebSocketProvider>
                ),
                Profile: () => <ProfilePage />,
                Users: () => <UsersPage />
              }),
              renderPage
            )}
          />
        </Suspense>
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
