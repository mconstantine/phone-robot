import { Layout, Typography } from 'antd'
import { constNull, pipe } from 'fp-ts/function'
import { useNetwork } from '../../../contexts/Network/Network'
import { foldPartialNetworkState } from '../../../contexts/Network/NetworkState'
import { Control } from './Control'
import './UI.less'

export function UI() {
  const network = useNetwork()

  return pipe(
    network,
    foldPartialNetworkState(
      {
        Operating: state => {
          const averageRTTLabel = `Average RTT: ${(
            state.averageRTT / 1000
          ).toFixed(3)} seconds`

          return (
            <Layout.Content className="UI">
              <div className="averageRTT">
                <Typography.Text type="secondary">
                  {averageRTTLabel}
                </Typography.Text>
              </div>
              <Control />
            </Layout.Content>
          )
        }
      },
      constNull
    )
  )
}
