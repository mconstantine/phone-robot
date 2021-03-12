import { either, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/lib/Option'
import { Server } from 'ws'
import { AuthorizationMessage, foldActor, foldMessage, Message } from './domain'
import { WebSocketClientHandler, WebSocketRobotHandler } from './handler'

export function initWebSocket(server: Server) {
  let clientHandler = new WebSocketClientHandler()
  let robotHandler = new WebSocketRobotHandler()

  server.on('connection', socket => {
    const authorizeClient = (message: AuthorizationMessage) => {
      const authorize = clientHandler.authorize(socket, message)

      authorize().then(
        option.fold(constVoid, socket =>
          socket.on('close', () => clientHandler.reset())
        )
      )
    }

    // TODO: this should be encapsulated into console.log(robotHandler)
    const authorizeRobot = (message: AuthorizationMessage) => {
      const authorize = robotHandler.authorize(socket, message)

      authorize().then(
        option.fold(constVoid, socket => {
          let isRobotAlive = true

          socket.on('pong', () => {
            isRobotAlive = true
          })

          let interval: Option<NodeJS.Timeout> = option.none
          let timeout: Option<NodeJS.Timeout> = option.none

          interval = option.some(
            setInterval(() => {
              isRobotAlive = false
              socket.ping()

              timeout = option.some(
                setTimeout(() => {
                  if (!isRobotAlive) {
                    socket.close()
                    pipe(interval, option.fold(constVoid, clearInterval))
                    pipe(timeout, option.fold(constVoid, clearTimeout))
                  }
                }, 10000)
              )
            }, 30000)
          )

          socket.on('close', () => robotHandler.reset())
        })
      )
    }

    socket.on(
      'message',
      flow(
        data => either.tryCatch(() => JSON.parse(data.toString()), constVoid),
        either.chainW(Message.decode),
        either.fold(constVoid, message =>
          pipe(
            message,
            foldMessage(
              message =>
                pipe(
                  message.from,
                  foldActor(
                    () => authorizeClient(message),
                    () => authorizeRobot(message)
                  )
                ),
              message =>
                pipe(
                  message.from,
                  foldActor(constVoid, () => robotHandler.reset())
                )
            )
          )
        )
      )
    )
  })
}
