import { BaseSchema } from '@adonisjs/lucid/schema'
import { randomInt } from 'node:crypto'

// Sans I, O, 0, 1 pour éviter les confusions quand le CP tape un code
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const makeCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

/**
 * Le CP scanne désormais le QR Code personnel des étudiants :
 *  - chaque étudiant reçoit un code de validation unique (users.attendance_code)
 *  - le jeton de QR Code par session (sessions.qr_token) n'a plus d'utilité
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('attendance_code', 8).nullable().unique()
    })

    this.schema.alterTable('sessions', (table) => {
      table.dropColumn('qr_token')
    })

    // Donne un code aux comptes déjà créés
    this.defer(async (db) => {
      const users = await db.from('users').whereNull('attendance_code').select('id')
      const used = new Set<string>()
      for (const user of users) {
        let code = makeCode()
        while (used.has(code)) code = makeCode()
        used.add(code)
        await db.from('users').where('id', user.id).update({ attendance_code: code })
      }
    })
  }

  async down() {
    this.schema.alterTable('sessions', (table) => {
      table.string('qr_token').nullable().unique()
    })
    this.schema.alterTable('users', (table) => {
      table.dropColumn('attendance_code')
    })
  }
}
