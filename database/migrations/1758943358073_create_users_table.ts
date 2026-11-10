import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      // Nouveaux champs pour la gestion des présences
      table.string('matricule').nullable().unique() // Numéro de carte / matricule étudiant
      table.string('role').notNullable().defaultTo('student') // 'student', 'teacher', 'admin'
      table.string('promotion').nullable() // Ex: 'L1', 'L2', 'L3', 'M1', 'M2'
      table.string('option').nullable() // Ex: 'Gestion Financière', etc.

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
