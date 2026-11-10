import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('course').notNullable()
      table.string('day').notNullable()
      table.string('hour').notNullable()

      table.string('promotion').notNullable()
      table.string('option').nullable()

      table.string('qr_token').notNullable().unique()

      table.timestamp('expires_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
