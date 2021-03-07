import { taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import WebSocket from 'ws'
import { verifyToken } from '../lib/jsonwebtoken'
import { getUserById } from '../user/userDatabase'
import { AuthorizationMessage, Message, Response } from './domain'
import { foldState, State, updateState } from './state'

export class WebSocketHandler {
  protected client: WebSocket
  protected state: State = { type: 'Idle' }

  constructor(client: WebSocket) {
    this.client = client
  }

  protected update(message: Message) {
    this.state = updateState(this.state, message)
  }

  protected sendResponse(response: Response) {
    this.client.send(pipe(response, Response.encode, JSON.stringify))
  }

  public authorize(_message: Message) {}
  public reset() {}
}

export class WebSocketClientHandler extends WebSocketHandler {
  authorize(message: AuthorizationMessage) {
    const authorize = pipe(
      verifyToken(message.accessToken, 'USER_ACCESS'),
      taskEither.fromEither,
      taskEither.chain(getUserById),
      taskEither.mapLeft(constVoid),
      taskEither.chain(taskEither.fromOption(constVoid)),
      taskEither.chain(_user =>
        taskEither.fromIO(() => {
          this.sendResponse({ type: 'Authorized' })
          this.update(message)
        })
      )
    )

    const refuse = taskEither.fromIO(() =>
      this.sendResponse({
        type: 'Refused',
        reason: 'Someone else is already connected'
      })
    )

    pipe(this.state, foldState(authorize, refuse))
  }

  reset() {
    this.update({ type: 'Reset' })
  }
}
