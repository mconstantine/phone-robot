import { useLayoutEffect, useRef } from 'react'

const TRACES_COLOR = '#442a11'
const CONTROL_COLOR = '#f3b765'

export function Control() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) {
        return
      }

      canvasRef.current.width = containerRef.current.clientWidth
      canvasRef.current.height = containerRef.current.clientHeight
    }

    const render = () => {
      const width = Math.round(canvas.width)
      const height = Math.round(canvas.height)
      const centerX = Math.round(width / 2)
      const centerY = Math.round(height / 2)

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
      context.arc(centerX, centerY, width / 3, 0, 2 * Math.PI)
      context.stroke()

      context.globalCompositeOperation = 'source-over'
      context.lineWidth = 2

      context.beginPath()
      context.arc(centerX, centerY, width / 3, 0, 2 * Math.PI)
      context.stroke()

      // Control
      context.globalCompositeOperation = 'destination-out'
      context.fillStyle = CONTROL_COLOR

      context.beginPath()
      context.arc(centerX, centerY, width / 12 + width / 80, 0, 2 * Math.PI)
      context.fill()

      context.globalCompositeOperation = 'source-over'

      context.beginPath()
      context.arc(centerX, centerY, width / 12, 0, 2 * Math.PI)
      context.fill()
    }

    const onResize = () => {
      resizeCanvas()
      render()
    }

    window.addEventListener('resize', onResize)

    resizeCanvas()
    render()

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="control" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  )
}
