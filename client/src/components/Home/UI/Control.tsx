import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const TRACES_COLOR = '#442a11'
const CONTROL_COLOR = '#f3b765'
const RETURN_ANIMATION_DURATION = 250

interface Point {
  x: number
  y: number
}

export function Control() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [movementStartPoint, setMovementStartPoint] = useState<Option<Point>>(
    option.none
  )

  const [currentMovementPoint, setCurrentMovementPoint] = useState<
    Option<Point>
  >(option.none)

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) {
      console.error('resize: unable to access canvas and/or container')
      console.log('canvas', canvas)
      console.log('container', container)

      return
    }

    const resizeCanvas = () => {
      canvas.style.width = container.clientWidth + 'px'
      canvas.style.height = container.clientHeight + 'px'
      canvas.width = dip(container.clientWidth)
      canvas.height = dip(container.clientHeight)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  useLayoutEffect(() => {
    if (!canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const canvasBoundingBox = canvas.getBoundingClientRect()

    const onMovementStart = (e: MouseEvent | TouchEvent) => {
      let clientX = -1
      let clientY = -1
      let x = -1
      let y = -1

      if (e.type === 'mousedown') {
        const event = e as MouseEvent

        clientX = event.clientX
        clientY = event.clientY
        x = dip(event.clientX - canvasBoundingBox.x)
        y = dip(event.clientY - canvasBoundingBox.y)
      } else if (e.type === 'touchstart') {
        const event = e as TouchEvent

        if (event.touches.length !== 1) {
          return
        }

        const touch = event.touches.item(0)!

        clientX = touch.clientX
        clientY = touch.clientY
        x = dip(touch.clientX - canvasBoundingBox.x)
        y = dip(touch.clientY - canvasBoundingBox.y)
      } else {
        return
      }

      // The user clicked the control if the distance between the clicked point and the center is lower
      // than the radius of the control. The square root part of the pythagorean theorem are removed
      // from both sides of the equation
      const clickDistanceFromCenter =
        Math.pow(canvas.width / 2 - x, 2) + Math.pow(canvas.height / 2 - y, 2)

      const controlRadiusSquared = Math.pow(getControlRadius(canvas.width), 2)

      const isClickingControl =
        controlRadiusSquared - clickDistanceFromCenter > 0

      if (isClickingControl) {
        e.preventDefault()
        e.stopPropagation()

        setMovementStartPoint(
          option.some({
            x: clientX,
            y: clientY
          })
        )
      }
    }

    canvas.addEventListener('mousedown', onMovementStart)
    canvas.addEventListener('touchstart', onMovementStart)

    return () => {
      canvas.removeEventListener('mousedown', onMovementStart)
      canvas.removeEventListener('touchstart', onMovementStart)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const onMovement = (e: MouseEvent | TouchEvent) => {
      pipe(
        movementStartPoint,
        option.fold(constVoid, startPoint => {
          e.preventDefault()
          e.stopPropagation()

          let clientX = -1
          let clientY = -1

          if (e.type === 'mousemove') {
            const event = e as MouseEvent

            clientX = event.clientX
            clientY = event.clientY
          } else if (e.type === 'touchmove') {
            const event = e as TouchEvent

            if (event.touches.length !== 1) {
              return
            }

            const touch = event.touches.item(0)!

            clientX = touch.clientX
            clientY = touch.clientY
          }

          setCurrentMovementPoint(
            option.some({
              x: dip(clientX - startPoint.x),
              y: dip(clientY - startPoint.y)
            })
          )
        })
      )
    }

    pipe(
      movementStartPoint,
      option.fold(
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
  }, [movementStartPoint])

  useLayoutEffect(() => {
    const stop = () => {
      pipe(
        currentMovementPoint,
        option.fold(constVoid, currentMovementPoint => {
          setMovementStartPoint(option.none)

          const startX = currentMovementPoint.x
          const startY = currentMovementPoint.y
          const startTime = Date.now()

          const step = () => {
            const currentTime = Date.now() - startTime

            const amount = ease(
              currentTime > RETURN_ANIMATION_DURATION
                ? 1
                : currentTime / RETURN_ANIMATION_DURATION
            )

            setCurrentMovementPoint(
              option.some({
                x: startX * (1 - amount),
                y: startY * (1 - amount)
              })
            )

            if (currentTime <= RETURN_ANIMATION_DURATION) {
              requestAnimationFrame(step)
            }
          }

          step()
        })
      )
    }

    const onMovementEnd = (e: MouseEvent | TouchEvent) => {
      pipe(
        movementStartPoint,
        option.fold(constVoid, () => {
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
  }, [movementStartPoint, currentMovementPoint])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    render(
      canvas,
      pipe(
        currentMovementPoint,
        option.getOrElse(() => ({ x: 0, y: 0 }))
      )
    )
  }, [currentMovementPoint])

  return (
    <div className="control" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  )
}

function getControlRadius(canvasWidth: number) {
  return Math.round(canvasWidth / 12)
}

function dip(pixelsCount: number) {
  return pixelsCount * window.devicePixelRatio
}

function ease(x: number) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

function render(canvas: HTMLCanvasElement, currentMovement: Point) {
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = width / 3

  context.clearRect(0, 0, width, height)

  const bottomRightX =
    centerX + centerX * 0.837 * Math.cos((45 * Math.PI) / 180)
  const bottomRightY =
    centerY + centerY * 0.837 * Math.sin((45 * Math.PI) / 180)
  const bottomLeftX =
    centerX + centerX * 0.837 * Math.cos((135 * Math.PI) / 180)
  const bottomLeftY =
    centerY + centerY * 0.837 * Math.sin((135 * Math.PI) / 180)

  const topLeftX = centerX + centerX * 0.837 * Math.cos((225 * Math.PI) / 180)
  const topLeftY = centerY + centerY * 0.837 * Math.sin((225 * Math.PI) / 180)
  const topRightX = centerX + centerX * 0.837 * Math.cos((315 * Math.PI) / 180)
  const topRightY = centerY + centerY * 0.837 * Math.sin((315 * Math.PI) / 180)

  context.fillStyle = TRACES_COLOR
  context.strokeStyle = TRACES_COLOR

  // NS trace
  context.beginPath()
  context.moveTo(centerX - 1, 0)
  context.lineTo(centerX + 1, 0)
  context.lineTo(centerX + 1, height)
  context.lineTo(centerX - 1, height)
  context.closePath()
  context.fill()

  // WE trace
  context.beginPath()
  context.moveTo(0, centerY - 1)
  context.lineTo(width, centerY - 1)
  context.lineTo(width, centerY + 1)
  context.lineTo(0, centerY + 1)
  context.closePath()
  context.fill()

  // NESW trace
  context.beginPath()
  context.moveTo(topRightX - 1, topRightY - 1)
  context.lineTo(topRightX + 1, topRightY + 1)
  context.lineTo(bottomLeftX + 1, bottomLeftY + 1)
  context.lineTo(bottomLeftX - 1, bottomLeftY - 1)
  context.closePath()
  context.fill()

  // NWSE trace
  context.beginPath()
  context.moveTo(topLeftX - 1, topLeftY + 1)
  context.lineTo(topLeftX + 1, topLeftY - 1)
  context.lineTo(bottomRightX + 1, bottomRightY - 1)
  context.lineTo(bottomRightX - 1, bottomRightY + 1)
  context.closePath()
  context.fill()

  // Middle circle
  context.globalCompositeOperation = 'destination-out'
  context.lineWidth = width / 40

  context.beginPath()
  context.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI)
  context.stroke()

  context.globalCompositeOperation = 'source-over'
  context.lineWidth = 2
  context.stroke()

  // Control
  context.globalCompositeOperation = 'destination-out'

  context.beginPath()
  context.arc(
    centerX,
    centerY,
    getControlRadius(width) + width / 80,
    0,
    2 * Math.PI
  )

  context.fill()
  context.globalCompositeOperation = 'source-over'
  context.stroke()

  context.fillStyle = CONTROL_COLOR

  const movementX = currentMovement.x
  const movementY = currentMovement.y
  const angle = Math.atan2(movementY, movementX)

  const distance = Math.min(
    Math.sqrt(Math.pow(movementX, 2) + Math.pow(movementY, 2)),
    maxRadius
  )

  const x = centerX + distance * Math.cos(angle)
  const y = centerY + distance * Math.sin(angle)

  context.beginPath()
  context.arc(x, y, getControlRadius(width), 0, 2 * Math.PI)
  context.fill()
}
