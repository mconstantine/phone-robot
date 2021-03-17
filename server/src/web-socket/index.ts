import { either } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Server } from 'ws'
import { AuthorizationMessage, foldActor, foldMessage, Message } from './domain'
import { WebSocketClientHandler, WebSocketRobotHandler } from './handler'

export function initWebSocket(server: Server) {
  let clientHandler = new WebSocketClientHandler()
  let robotHandler = new WebSocketRobotHandler()

  server.on('connection', socket => {
    const authorizeClient = (message: AuthorizationMessage) => {
      const authorize = clientHandler.authorize(socket, message)
      authorize()
    }

    const authorizeRobot = (message: AuthorizationMessage) => {
      const authorize = robotHandler.authorize(socket, message)
      authorize()
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
