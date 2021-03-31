import { useRef } from 'react'
import { Reader } from 'fp-ts/Reader'
import { Command } from '../globalDomain'
import { Option } from 'fp-ts/Option'
import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'

export function useDebounceCommand(
  callback: Reader<Command, void>,
  interval: number
): Reader<Command, void> {
  const lastCallTime = useRef(Date.now())
  const uniformityInterval = useRef<Option<number>>(option.none)

  const clearUniformityInterval = () =>
    pipe(
      uniformityInterval.current,
      option.fold(constVoid, timeout => window.clearInterval(timeout))
    )

  const scheduleUniformityTimeout = (command: Command) => {
    clearUniformityInterval()

    uniformityInterval.current = pipe(
      window.setInterval(() => {
        callback(command)
      }, interval),
      option.some
    )
  }

  return command => {
    if (command.speed === 0) {
      clearUniformityInterval()
      window.setTimeout(() => callback(command), interval)
    } else {
      const now = Date.now()

      if (now - lastCallTime.current < interval) {
        scheduleUniformityTimeout(command)
      } else {
        callback(command)
        lastCallTime.current = now
        scheduleUniformityTimeout(command)
      }
    }
  }
}
