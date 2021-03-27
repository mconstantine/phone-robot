import { boolean, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  CanvasUtils,
  CartesianPoint,
  dip,
  PolarPoint,
  useCanvas
} from './useCanvas'

const TRACES_COLOR = '#442a11'
const CONTROL_COLOR = '#f3b765'
const RETURN_ANIMATION_DURATION = 250

interface Props {
  position: Option<PolarPoint>
  onChange: Reader<Option<PolarPoint>, unknown>
}

export function Control(props: Props) {
  const { position, onChange } = props
  const [isMoving, setIsMoving] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const utils = useCanvas(containerRef, canvasRef)

  // On mouse down / touch start
  useLayoutEffect(() => {
    const onMovementStart = (e: MouseEvent | TouchEvent) =>
      pipe(
        utils,
        option.fold(constVoid, utils => {
          let clickPosition: CartesianPoint

          if (e.type === 'mousedown') {
            const event = e as MouseEvent

            clickPosition = {
              x: dip(event.clientX - utils.left),
              y: dip(event.clientY - utils.top)
            }
          } else if (e.type === 'touchstart') {
            const event = e as TouchEvent

            if (event.touches.length !== 1) {
              return
            }

            const touch = event.touches.item(0)!

            clickPosition = {
              x: dip(touch.clientX - utils.left),
              y: dip(touch.clientY - utils.top)
            }
          } else {
            return
          }

          const polarClickPosition = toPolar(utils.canvasCenter, clickPosition)

          const isClickingControl =
            polarClickPosition.distance <= utils.controlRadius

          if (isClickingControl) {
            e.preventDefault()
            e.stopPropagation()
            setIsMoving(true)
          }
        })
      )

    pipe(
      utils,
      option.fold(constVoid, ({ canvas }) => {
        canvas.addEventListener('mousedown', onMovementStart)
        canvas.addEventListener('touchstart', onMovementStart)
      })
    )

    return () => {
      pipe(
        utils,
        option.fold(constVoid, ({ canvas }) => {
          canvas.removeEventListener('mousedown', onMovementStart)
          canvas.removeEventListener('touchstart', onMovementStart)
        })
      )
    }
  }, [utils])

  // On drag
  useEffect(() => {
    const onMovement = (e: MouseEvent | TouchEvent) => {
      pipe(
        utils,
        option.fold(constVoid, utils =>
          pipe(
            isMoving,
            boolean.fold(constVoid, () => {
              let position: CartesianPoint

              if (e.type === 'mousemove') {
                const event = e as MouseEvent

                position = {
                  x: dip(event.clientX - utils.left),
                  y: dip(event.clientY - utils.top)
                }
              } else if (e.type === 'touchmove') {
                const event = e as TouchEvent

                if (event.touches.length !== 1) {
                  return
                }

                const touch = event.touches.item(0)!

                position = {
                  x: dip(touch.clientX - utils.left),
                  y: dip(touch.clientY - utils.top)
                }
              } else {
                return
              }

              const polarPosition = toPolar(utils.canvasCenter, position)

              onChange(
                option.some({
                  distance: Math.min(polarPosition.distance, utils.maxRadius),
                  angle: polarPosition.angle
                })
              )
            })
          )
        )
      )
    }

    pipe(
      isMoving,
      boolean.fold(
        () => {
          document.body.removeEventListener('mousemove', onMovement)
          document.body.removeEventListener('touchmove', onMovement)
        },
        () => {
          document.body.addEventListener('mousemove', onMovement)
          document.body.addEventListener('touchmove', onMovement)
        }
      )
    )

    return () => {
      document.body.removeEventListener('mousemove', onMovement)
      document.body.removeEventListener('touchmove', onMovement)
    }
  }, [isMoving, utils, onChange])

  // On mouse up / touch end
  useLayoutEffect(() => {
    const stop = () => {
      pipe(
        position,
        option.fold(constVoid, position => {
          setIsMoving(false)

          const startDistance = position.distance
          const angle = position.angle
          const startTime = Date.now()

          const step = () => {
            const currentTime = Date.now() - startTime

            const amount = ease(
              currentTime > RETURN_ANIMATION_DURATION
                ? 1
                : currentTime / RETURN_ANIMATION_DURATION
            )

            onChange(
              option.some({
                distance: startDistance * (1 - amount),
                angle
              })
            )

            if (currentTime <= RETURN_ANIMATION_DURATION) {
              requestAnimationFrame(step)
            } else {
              onChange(option.none)
            }
          }

          step()
        })
      )
    }

    const onMovementEnd = (e: MouseEvent | TouchEvent) => {
      pipe(
        isMoving,
        boolean.fold(constVoid, () => {
          e.preventDefault()
          e.stopPropagation()

          stop()
        })
      )
    }

    document.body.addEventListener('mouseup', onMovementEnd)
    document.body.addEventListener('touchend', onMovementEnd)

    return () => {
      document.body.removeEventListener('mouseup', onMovementEnd)
      document.body.removeEventListener('touchend', onMovementEnd)
    }
  }, [isMoving, position, utils, onChange])

  // Call to render
  useEffect(() => {
    pipe(
      utils,
      option.fold(constVoid, utils =>
        pipe(
          position,
          option.getOrElse(() => ({ distance: 0, angle: 0 })),
          position => render(utils, position)
        )
      )
    )
  }, [utils, position])

  return (
    <div className="control" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  )
}

function ease(x: number) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

function render(utils: CanvasUtils, controlPosition: PolarPoint): void {
  const {
    context,
    maxRadius,
    canvasCenter: center,
    width,
    height,
    controlRadius
  } = utils

  context.clearRect(0, 0, width, height)

  const bottomRight: CartesianPoint = {
    x: center.x + center.x * 1.837 * Math.cos((45 * Math.PI) / 180),
    y: center.y + center.y * 1.837 * Math.sin((45 * Math.PI) / 180)
  }

  const bottomLeft: CartesianPoint = {
    x: center.x + center.x * 1.837 * Math.cos((135 * Math.PI) / 180),
    y: center.y + center.y * 1.837 * Math.sin((135 * Math.PI) / 180)
  }

  const topLeft: CartesianPoint = {
    x: center.x + center.x * 1.837 * Math.cos((225 * Math.PI) / 180),
    y: center.y + center.y * 1.837 * Math.sin((225 * Math.PI) / 180)
  }

  const topRight: CartesianPoint = {
    x: center.x + center.x * 1.837 * Math.cos((315 * Math.PI) / 180),
    y: center.y + center.y * 1.837 * Math.sin((315 * Math.PI) / 180)
  }

  context.fillStyle = TRACES_COLOR
  context.strokeStyle = TRACES_COLOR

  // NS trace
  context.beginPath()
  context.moveTo(center.x - 1, 0)
  context.lineTo(center.x + 1, 0)
  context.lineTo(center.x + 1, height)
  context.lineTo(center.x - 1, height)
  context.closePath()
  context.fill()

  // WE trace
  context.beginPath()
  context.moveTo(0, center.y - 1)
  context.lineTo(width, center.y - 1)
  context.lineTo(width, center.y + 1)
  context.lineTo(0, center.y + 1)
  context.closePath()
  context.fill()

  // NESW trace
  context.beginPath()
  context.moveTo(topRight.x - 1, topRight.y - 1)
  context.lineTo(topRight.x + 1, topRight.y + 1)
  context.lineTo(bottomLeft.x + 1, bottomLeft.y + 1)
  context.lineTo(bottomLeft.x - 1, bottomLeft.y - 1)
  context.closePath()
  context.fill()

  // NWSE trace
  context.beginPath()
  context.moveTo(topLeft.x - 1, topLeft.y + 1)
  context.lineTo(topLeft.x + 1, topLeft.y - 1)
  context.lineTo(bottomRight.x + 1, bottomRight.y - 1)
  context.lineTo(bottomRight.x - 1, bottomRight.y + 1)
  context.closePath()
  context.fill()

  // Middle circle
  context.globalCompositeOperation = 'destination-out'
  context.lineWidth = width / 40

  context.beginPath()
  context.arc(center.x, center.y, maxRadius, 0, 2 * Math.PI)
  context.stroke()

  context.globalCompositeOperation = 'source-over'
  context.lineWidth = 2
  context.stroke()

  // Control
  context.globalCompositeOperation = 'destination-out'

  context.beginPath()
  context.arc(center.x, center.y, controlRadius + width / 80, 0, 2 * Math.PI)

  context.fill()
  context.globalCompositeOperation = 'source-over'
  context.stroke()

  context.fillStyle = CONTROL_COLOR

  const controlCenter = toCartesian(center, controlPosition)

  context.beginPath()
  context.arc(controlCenter.x, controlCenter.y, controlRadius, 0, 2 * Math.PI)
  context.fill()
}

function toPolar(center: CartesianPoint, point: CartesianPoint): PolarPoint {
  return {
    distance: Math.sqrt(
      Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
    ),
    angle: Math.atan2(point.y - center.y, point.x - center.x)
  }
}

function toCartesian(
  center: CartesianPoint,
  point: PolarPoint
): CartesianPoint {
  return {
    x: center.x + point.distance * Math.cos(point.angle),
    y: center.y + point.distance * Math.sin(point.angle)
  }
}
