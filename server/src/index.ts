import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { pipe } from 'fp-ts/function'
import { initDatabase } from './database/init'
import { taskEither } from 'fp-ts'
import { userRouter } from './user'

dotenv.config()
const port = process.env.SERVER_PORT!

const init = pipe(
  initDatabase(),
  taskEither.bimap(
    error => {
      console.log(error.message)
    },
    () => {
      express()
        .use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .get('/', (_req, res) => res.end())
        .use('/users', userRouter())
        .use((_req, res) => res.status(404).end())
        .listen(port, () =>
          console.log(`Server ready at http://localhost:${port}`)
        )
    }
  )
)

init()
