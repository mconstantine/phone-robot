import express from 'express'
import dotenv from 'dotenv'
import { pipe } from 'fp-ts/function'
import { initDatabase } from './database/init'
import { taskEither } from 'fp-ts'
import { userRouter } from './user/userIndex'
import cors from 'cors'
import { Server } from 'ws'
import http from 'http'
import { initWebSocket } from './web-socket'

dotenv.config()
const port = process.env.SERVER_PORT!

const init = pipe(
  initDatabase(),
  taskEither.bimap(
    error => {
      console.log(error.message)
    },
    () => {
      const app = express()

      app
        .use(cors())
        .use(express.json())
        .use(express.urlencoded({ extended: true }))
        .get('/', (_req, res) => res.end())
        .use('/users', userRouter())
        .use((_req, res) => res.status(404).end())

      const server = http.createServer(app)
      const webSocketServer = new Server({ server })

      initWebSocket(webSocketServer)

      server.listen(port, () =>
        console.log(`Server ready at http://localhost:${port}`)
      )
    }
  )
)

init()
