import { Button, Layout, Result } from 'antd'
import { pipe } from 'fp-ts/function'
import { useAccount } from '../../contexts/Account/Account'
import { HandshakeTimeline } from './HandshakeTimeline'
import { useNetwork } from '../../contexts/Network/Network'
import { foldNetworkState } from '../../contexts/Network/NetworkState'
import { UI } from './UI'
import { foldRefusalReason } from './domain'

export default function HomePage() {
  const network = useNetwork()
  const { dispatchAccountAction } = useAccount()

  return (
    <Layout.Content>
      {pipe(
        network,
        foldNetworkState({
          Connecting: () => <HandshakeTimeline />,
          Authorizing: () => <HandshakeTimeline />,
          WaitingForPeer: () => <HandshakeTimeline />,
          Handshaking: () => <HandshakeTimeline />,
          Operating: () => <UI />,
          Error: error =>
            pipe(
              error.reason,
              foldRefusalReason(
                () => (
                  <Result
                    status="error"
                    title="Connection refused"
                    subTitle={error.message}
                  />
                ),
                () => (
                  <Result
                    status="error"
                    title="Invalid credentials"
                    subTitle={error.message}
                    extra={[
                      <Button
                        onClick={() =>
                          dispatchAccountAction({ type: 'Logout' })
                        }
                      >
                        Logout
                      </Button>
                    ]}
                  />
                )
              )
            )
        })
      )}
    </Layout.Content>
  )
}
