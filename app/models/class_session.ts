import { SessionSchema } from '#database/schema'

/**
 * Une séance de cours créée par le CP.
 * (Nommé ClassSession pour ne pas le confondre avec la "session" HTTP d'AdonisJS.)
 */
export default class ClassSession extends SessionSchema {
  static table = 'sessions'
}
