import { either, option, taskEither } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import WebSocket, { Server } from 'ws'
import { verifyToken } from '../lib/jsonwebtoken'
import { getUserById } from '../user/userDatabase'
import { Actor, foldActor, foldMessage, Message, Response } from './domain'
import { reducer, State } from './state'

// TODO: what if a client connects while another client is already connected?
export function initWebSocket(server: Server) {
  let uiState: State = { type: 'Idle' }
  let robotState: State = { type: 'Idle' }

  const sendResponse = (client: WebSocket, response: Response) =>
    client.send(JSON.stringify(response))

  server.on('connection', socket => {
    let actor: Option<Actor> = option.none

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
                    const authorize = pipe(
                      verifyToken(message.accessToken, 'USER_ACCESS'),
                      taskEither.fromEither,
                      taskEither.chain(getUserById),
                      taskEither.mapLeft(constVoid),
                      taskEither.chain(taskEither.fromOption(constVoid)),
                      taskEither.chain(_user =>
                        taskEither.fromIO(() => {
                          actor = option.some(message.from)
                          sendResponse(socket, { type: 'Authorized' })
                          uiState = reducer(uiState, message)
                        })
                      )
                    )

                    authorize()
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
        actor,
        option.fold(
          constVoid,
          foldActor(
            () => {
              uiState = reducer(uiState, { type: 'Reset', from: 'UI' })
            },
            () => {
              robotState = reducer(robotState, { type: 'Reset', from: 'Robot' })
            }
          )
        )
      )
    })
  })
}
