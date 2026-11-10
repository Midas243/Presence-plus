import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('session_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sessions')
        .onDelete('CASCADE')

      table.timestamp('scanned_at').notNullable()

      table.string('status').notNullable().defaultTo('present')

      table.unique(['user_id', 'session_id'])

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
