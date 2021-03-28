import { either, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Server } from 'ws'
import { AuthorizationMessage, foldActor, foldMessage, Message } from './domain'
import { WebSocketClientHandler, WebSocketRobotHandler } from './handler'

export function initWebSocket(server: Server) {
  let clientHandler: WebSocketClientHandler
  let robotHandler: WebSocketRobotHandler

  clientHandler = new WebSocketClientHandler(() =>
    robotHandler.signalPeerDisconnected()
  )

  robotHandler = new WebSocketRobotHandler(() =>
    clientHandler.signalPeerDisconnected()
  )

  server.on('connection', socket => {
    console.log('New connection')

    const authorizeClient = (message: AuthorizationMessage) => {
      const authorize = pipe(
        clientHandler.authorize(socket, message),
        taskEither.chain(() =>
          taskEither.fromIO(() => {
            console.log('Client is in')

            if (robotHandler.isConnected()) {
              clientHandler.signalPeerConnected()
              robotHandler.signalPeerConnected()
            }
          })
        )
      )

      authorize()
    }

    const authorizeRobot = (message: AuthorizationMessage) => {
      const authorize = pipe(
        robotHandler.authorize(socket, message),
        taskEither.chain(() =>
          taskEither.fromIO(() => {
            console.log('Robot is in')

            if (clientHandler.isConnected()) {
              clientHandler.signalPeerConnected()
              robotHandler.signalPeerConnected()
            }
          })
        )
      )

      authorize()
    }

    socket.on('message', data => {
      console.log(data)

      pipe(
        either.tryCatch(() => JSON.parse(data.toString()), constVoid),
        either.chainW(Message.decode),
        either.fold(constVoid, message =>
          pipe(
            message,
            foldMessage({
              Authorization: message =>
                pipe(
                  message.from,
                  foldActor(
                    () => authorizeClient(message),
                    () => authorizeRobot(message)
                  )
                ),
              Reset: message =>
                pipe(
                  message.from,
                  foldActor(constVoid, () => robotHandler.reset())
                ),
              Handshaking: () => robotHandler.forwardHandshakingMessage(),
              Command: message => robotHandler.forwardCommandMessage(message),
              Ack: () => {
                robotHandler.registerAck()
                clientHandler.forwardAckMessage()
              }
            })
          )
        )
      )
    })
  })
}
