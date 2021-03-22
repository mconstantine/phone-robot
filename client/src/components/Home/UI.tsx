import { Layout } from 'antd'
import { constNull, pipe } from 'fp-ts/function'
import { useNetwork } from '../../contexts/Network/Network'
import { foldPartialNetworkState } from '../../contexts/Network/NetworkState'

export function UI() {
  const network = useNetwork()

  return pipe(
    network,
    foldPartialNetworkState(
      {
        Operating: state => (
          <Layout.Content>
            <p>{state.averageRTT}</p>
          </Layout.Content>
        )
      },
      constNull
    )
  )
}
