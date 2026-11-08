import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Laisse passer uniquement le CP, c'est-à-dire quelqu'un qui a saisi le bon code.
 */
export default class CpAuthMiddleware {
  async handle({ session, response }: HttpContext, next: NextFn) {
    if (!session.get('cp_authenticated')) {
      session.flash('error', 'Entre le code du CP pour accéder à cet espace.')
      return response.redirect().toRoute('cp.login')
    }
    return next()
  }
}
