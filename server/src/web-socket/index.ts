import { either, option, taskEither } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import WebSocket, { Server } from 'ws'
import { verifyToken } from '../lib/jsonwebtoken'
import { getUserById } from '../user/userDatabase'
import { Actor, foldActor, foldMessage, Message, Response } from './domain'
import { updateState, State, foldState } from './state'

export function initWebSocket(server: Server) {
  let uiState: State = { type: 'Idle' }
  let robotState: State = { type: 'Idle' }

  const sendResponse = (client: WebSocket, response: Response) =>
    client.send(pipe(response, Response.encode, JSON.stringify))

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
                          uiState = updateState(uiState, message)
                        })
                      )
                    )

                    const refuse = taskEither.fromIO(() =>
                      sendResponse(socket, {
                        type: 'Refused',
                        reason: 'Someone else is already connected'
                      })
                    )

                    pipe(uiState, foldState(authorize, refuse))
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
              uiState = updateState(uiState, { type: 'Reset', from: 'UI' })
            },
            () => {
              robotState = updateState(robotState, {
                type: 'Reset',
                from: 'Robot'
              })
            }
          )
        )
      )
    })
  })
}
