import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { RouteError } from '../route'
import { dbExec } from './utils'

export function initDatabase(): TaskEither<RouteError, void> {
  return dbExec(SQL`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER NOT NULL PRIMARY KEY,
      username TEXT NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS user_updated_at AFTER UPDATE ON user
    FOR EACH ROW BEGIN
      UPDATE user SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `)
}
