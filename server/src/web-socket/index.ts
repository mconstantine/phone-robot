import { either, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { Server } from 'ws'
import { foldActor, foldMessage, Message } from './domain'
import { WebSocketClientHandler, WebSocketHandler } from './handler'

export function initWebSocket(server: Server) {
  server.on('connection', socket => {
    let handler: Option<WebSocketHandler> = option.none

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
                  () => {
                    const clientHandler = new WebSocketClientHandler(socket)
                    handler = option.some(clientHandler)
                    clientHandler.authorize(message)
                  },
                  () => console.log('TODO: authorize robot')
                )
              ),
            constVoid
          )
        )
      )
    )

    socket.on('close', () => {
      pipe(
        handler,
        option.fold(constVoid, handler => handler.reset())
      )
    })
  })
}
