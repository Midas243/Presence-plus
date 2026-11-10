/**
 * Vérifie la connexion à Neon (URL poolée + URL directe) puis l'état des migrations.
 * Usage : node scripts/check_neon.mjs
 *
 *  - DATABASE_URL           : URL « poolée » (…-pooler…), utilisée par l'application
 *  - DATABASE_URL_UNPOOLED  : URL directe, utilisée pour les migrations (connexion pg_direct).
 *                             Si elle est absente, elle est déduite de DATABASE_URL.
 */
import pg from 'pg'

try {
  process.loadEnvFile('.env')
} catch {
  // pas de fichier .env : on utilise les variables déjà présentes dans l'environnement
}

const pooledUrl = process.env.DATABASE_URL?.trim()
const directUrl =
  process.env.DATABASE_URL_UNPOOLED?.trim() || pooledUrl?.replace(/-pooler(?=\.)/, '')

const targets = [
  { name: 'DATABASE_URL', role: 'application', url: pooledUrl, pooled: true },
  { name: 'URL directe', role: 'migrations', url: directUrl, pooled: false },
]

let failed = false

for (const { name, role, url, pooled } of targets) {
  if (!url) {
    console.log(`✗ ${name} : variable absente du .env`)
    failed = true
    continue
  }

  // Vérifie le format sans jamais afficher la valeur (elle contient le mot de passe)
  let host
  try {
    host = new URL(url).host
    if (!/^postgres(ql)?:$/.test(new URL(url).protocol)) throw new Error('protocole')
  } catch {
    const prefix = url.match(/^([A-Za-z_]+)=/)?.[1]
    console.log(`✗ ${name} : valeur invalide, elle doit commencer par postgresql://`)
    if (prefix) {
      console.log(`    elle commence par « ${prefix}= » : le nom de la variable a été collé deux fois dans le .env`)
    }
    failed = true
    continue
  }
  const looksPooled = host.includes('-pooler')
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 })

  try {
    await client.connect()
    const { rows } = await client.query('select current_database() as db, current_user as usr')
    const tables = (
      await client.query(
        "select table_name from information_schema.tables where table_schema = 'public' order by 1"
      )
    ).rows.map((row) => row.table_name)

    console.log(`✓ ${name} (${role}) : connecté à ${host}`)
    console.log(`    base=${rows[0].db}  utilisateur=${rows[0].usr}`)
    console.log(`    tables : ${tables.length ? tables.join(', ') : '(aucune : migrations non lancées)'}`)
    if (looksPooled !== pooled) {
      console.log(
        `    ⚠ cette URL ${looksPooled ? 'est' : "n'est pas"} une URL poolée, ${pooled ? 'elle devrait l’être' : 'elle ne devrait pas l’être'}`
      )
      failed = true
    }
    if (tables.includes('adonis_schema')) {
      const done = await client.query('select count(*)::int as n from adonis_schema')
      console.log(`    migrations appliquées : ${done.rows[0].n}`)
    }
  } catch (error) {
    console.log(`✗ ${name} (${role}) : ${error.code ?? ''} ${error.message}`)
    failed = true
  } finally {
    await client.end().catch(() => {})
  }
}

console.log(failed ? '\nÉCHEC : voir les lignes ✗ / ⚠ ci-dessus' : '\nOK : les deux connexions Neon fonctionnent')
process.exit(failed ? 1 : 0)
