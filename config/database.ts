import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const databaseUrl = env.get('DATABASE_URL')

/**
 * Neon : l'URL « directe » est la même que l'URL « poolée » sans « -pooler »
 * dans le nom d'hôte. On la déduit si DATABASE_URL_UNPOOLED n'est pas définie.
 */
const directUrl = env.get('DATABASE_URL_UNPOOLED') ?? databaseUrl.replace(/-pooler(?=\.)/, '')

const migrations = {
  naturalSort: true,
  paths: ['database/migrations'],
}

const schemaGeneration = {
  enabled: true,
  rulesPaths: ['./database/schema_rules.js'],
}

const dbConfig = defineConfig({
  connection: 'pg',

  prettyPrintDebugQueries: true,

  connections: {
    /**
     * Connexion de l'application (URL poolée, adaptée à de nombreux clients courts)
     */
    pg: {
      client: 'pg',
      connection: {
        connectionString: databaseUrl,
      },
      migrations,
      schemaGeneration,
      debug: app.inDev,
    },

    /**
     * Connexion directe, réservée aux migrations :
     * node ace migration:run --connection=pg_direct
     */
    pg_direct: {
      client: 'pg',
      connection: {
        connectionString: directUrl,
      },
      migrations,
      schemaGeneration,
      debug: false,
    },
  },
})

export default dbConfig
