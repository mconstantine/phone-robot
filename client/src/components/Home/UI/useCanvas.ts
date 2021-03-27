import { option } from 'fp-ts'
import { Option } from 'fp-ts/Option'
import { RefObject, useLayoutEffect, useState } from 'react'
import {
  Command,
  degreesAngleFromRadians,
  getPercentage,
  radiansAngleFromDegrees
} from '../../../globalDomain'

export interface CartesianPoint {
  x: number
  y: number
}

export interface PolarPoint {
  distance: number
  angle: number
}

export function polarPointFromCommand(
  command: Command,
  maxRadius: number
): PolarPoint {
  return {
    distance: command.speed * maxRadius,
    angle: radiansAngleFromDegrees(command.angle)
  }
}

export function commandFromPolarPoint(
  point: PolarPoint,
  maxRadius: number
): Command {
  return {
    speed: getPercentage(Math.min(point.distance, maxRadius), maxRadius),
    angle: degreesAngleFromRadians(point.angle)
  }
}

export interface CanvasUtils {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  top: number
  left: number
  width: number
  height: number
  canvasCenter: CartesianPoint
  maxRadius: number
  controlRadius: number
}

export function useCanvas(
  containerRef: RefObject<HTMLDivElement>,
  canvasRef: RefObject<HTMLCanvasElement>
): Option<CanvasUtils> {
  const [state, setState] = useState<Option<CanvasUtils>>(option.none)

  // On resize
  useLayoutEffect(() => {
    const update = () => {
      const canvas = canvasRef.current
      const container = containerRef.current

      if (!canvas || !container) {
        return
      }

      canvas.style.width = container.clientWidth + 'px'
      canvas.style.height = container.clientHeight + 'px'

      const width = dip(container.clientWidth)
      const height = dip(container.clientHeight)
      const { top, left } = container.getBoundingClientRect()

      canvas.width = width
      canvas.height = height

      const canvasCenter: CartesianPoint = {
        x: width / 2,
        y: width / 2
      }

      const maxRadius = width / 3
      const controlRadius = width / 12

      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      setState(
        option.some({
          canvas,
          context,
          top,
          left,
          width,
          height,
          canvasCenter,
          maxRadius,
          controlRadius
        })
      )
    }

    update()
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      setState(option.none)
    }
  }, [containerRef, canvasRef])

  return state
}

export function dip(pixelsCount: number) {
  return pixelsCount * window.devicePixelRatio
}
