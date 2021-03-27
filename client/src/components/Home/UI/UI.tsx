import { Layout, Typography } from 'antd'
import { option } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { useEffect, useState } from 'react'
import { useNetwork } from '../../../contexts/Network/Network'
import { foldPartialNetworkState } from '../../../contexts/Network/NetworkState'
import { Control } from './Control'
import { PolarPoint } from './useCanvas'
import './UI.less'

export function UI() {
  const network = useNetwork()

  const [currentControlPosition, setCurrentControlPosition] = useState<
    Option<PolarPoint>
  >(option.none)

  useEffect(() => {
    // TODO: send this to robot
    pipe(
      currentControlPosition,
      option.fold(constVoid, position => {
        let angle = Math.round((position.angle / Math.PI) * 180)

        if (angle < 0) {
          angle = 360 + angle
        } else if (angle === -0) {
          angle = 0
        }

        // console.log({
        //   distance: position.distance,
        //   angle
        // })
      })
    )
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
              <Control
                position={currentControlPosition}
                onChange={setCurrentControlPosition}
              />
            </Layout.Content>
          )
        }
      },
      constNull
    )
  )
}
