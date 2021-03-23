import { useLayoutEffect, useRef } from 'react'

const TRACES_COLOR = '#442a11'
const CONTROL_COLOR = '#f3b765'
const RETURN_ANIMATION_DURATION = 250

export function Control() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return
    }

    const canvas = canvasRef.current
    let context = canvas.getContext('2d')!

    if (!context) {
      return
    }

    let isMovingControl = false
    let movementStartClientX = -1
    let movementStartClientY = -1
    let currentMovementX = 0
    let currentMovementY = 0

    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) {
        return
      }

      canvasRef.current.style.width = containerRef.current.clientWidth + 'px'
      canvasRef.current.style.height = containerRef.current.clientHeight + 'px'

      canvasRef.current.width = dip(containerRef.current.clientWidth)
      canvasRef.current.height = dip(containerRef.current.clientHeight)
      context = canvasRef.current.getContext('2d')!
    }

    const render = () => {
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
      const topLeftX =
        centerX + centerX * 0.837 * Math.cos((225 * Math.PI) / 180)
      const topLeftY =
        centerY + centerY * 0.837 * Math.sin((225 * Math.PI) / 180)
      const topRightX =
        centerX + centerX * 0.837 * Math.cos((315 * Math.PI) / 180)
      const topRightY =
        centerY + centerY * 0.837 * Math.sin((315 * Math.PI) / 180)

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

      const movementX = currentMovementX
      const movementY = currentMovementY
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

    const onMovementStart = (e: MouseEvent | TouchEvent) => {
      const canvasBoundingBox = canvas.getBoundingClientRect()

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

        isMovingControl = true
        movementStartClientX = clientX
        movementStartClientY = clientY
      }
    }

    const onMovement = (e: MouseEvent | TouchEvent) => {
      if (!isMovingControl) {
        return
      }

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

      currentMovementX = dip(clientX - movementStartClientX)
      currentMovementY = dip(clientY - movementStartClientY)

      render()
    }

    const stop = () => {
      isMovingControl = false

      const startX = currentMovementX
      const startY = currentMovementY
      const startTime = Date.now()

      const step = () => {
        if (isMovingControl) {
          return
        }

        const currentTime = Date.now() - startTime

        const amount = ease(
          currentTime > RETURN_ANIMATION_DURATION
            ? 1
            : currentTime / RETURN_ANIMATION_DURATION
        )

        currentMovementX = startX * (1 - amount)
        currentMovementY = startY * (1 - amount)

        render()

        if (currentTime <= RETURN_ANIMATION_DURATION) {
          requestAnimationFrame(step)
        }
      }

      step()
    }

    const onMovementEnd = (e: MouseEvent | TouchEvent) => {
      if ((isMovingControl && e.type === 'mouseup') || e.type === 'touchend') {
        e.preventDefault()
        e.stopPropagation()

        stop()
      }
    }

    const onResize = () => {
      resizeCanvas()
      render()
    }

    window.addEventListener('resize', onResize)
    canvas.addEventListener('mousedown', onMovementStart)
    document.body.addEventListener('mouseup', onMovementEnd)
    canvas.addEventListener('mousemove', onMovement)
    canvas.addEventListener('touchstart', onMovementStart)
    document.body.addEventListener('touchend', onMovementEnd)
    canvas.addEventListener('touchmove', onMovement)

    resizeCanvas()
    render()

    return () => {
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousedown', onMovementStart)
      document.body.removeEventListener('mouseup', onMovementEnd)
      canvas.removeEventListener('mousemove', onMovement)
      canvas.removeEventListener('touchstart', onMovementStart)
      document.body.removeEventListener('touchend', onMovementEnd)
      canvas.removeEventListener('touchmove', onMovement)
    }
  }, [])

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
