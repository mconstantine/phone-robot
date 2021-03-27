import { Layout, Typography } from 'antd'
import { constNull, pipe } from 'fp-ts/function'
import { useEffect, useState } from 'react'
import { useNetwork } from '../../../contexts/Network/Network'
import { foldPartialNetworkState } from '../../../contexts/Network/NetworkState'
import { Control, PolarPoint } from './Control'
import './UI.less'

export function UI() {
  const network = useNetwork()

  const [
    currentControlPosition,
    setCurrentControlPosition
  ] = useState<PolarPoint>({
    distance: 0,
    angle: 0
  })

  useEffect(() => {
    // TODO: send this to robot
    console.log(currentControlPosition)
  }, [currentControlPosition])

  return pipe(
    network,
    foldPartialNetworkState(
      {
        Operating: state => {
          const avgRTT = (state.minRTT + state.maxRTT) / 2

          const averageRTTLabel = `Average RTT: ${(avgRTT / 1000).toFixed(
            3
          )} seconds`

          return (
            <Layout.Content className="UI">
              <div className="averageRTT">
                <Typography.Text type="secondary">
                  {averageRTTLabel}
                </Typography.Text>
              </div>
              <Control onUpdate={setCurrentControlPosition} />
            </Layout.Content>
          )
        }
      },
      constNull
    )
  )
}
