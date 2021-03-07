import { either, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Server } from 'ws'
import { AuthorizationMessage, foldActor, foldMessage, Message } from './domain'
import { WebSocketClientHandler } from './handler'

export function initWebSocket(server: Server) {
  let clientHandler = new WebSocketClientHandler()

  server.on('connection', socket => {
    const authorizeClient = (message: AuthorizationMessage) => {
      const authorize = clientHandler.authorize(socket, message)
      authorize().then(
        option.fold(constVoid, socket =>
          socket.on('close', () => {
            clientHandler.reset()
          })
        )
      )
    }

    socket.on(
      'message',
      flow(
        data => either.tryCatch(() => JSON.parse(data.toString()), constVoid),
        either.chainW(Message.decode),
        either.fold(
          constVoid,
          foldMessage(
            message =>
              pipe(
                message.from,
                foldActor(
                  () => authorizeClient(message),
                  () => console.log('TODO: authorize robot')
                )
              ),
            constVoid
          )
        )
      )
    )
  })
}
