import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')

// Authentification étudiant
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

// Espace étudiant
router
  .group(() => {
    router.get('/dashboard', [controllers.Dashboard, 'index']).as('dashboard')
    router.get('/taux-de-presence', [controllers.Dashboard, 'rate']).as('rate')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

// Espace CP : connexion par code
router
  .group(() => {
    router.get('/login', [controllers.CpAuth, 'create']).as('login')
    router.post('/login', [controllers.CpAuth, 'store']).as('login.store')
  })
  .prefix('/cp')
  .as('cp')

// Espace CP : tableau de bord et sessions (protégé par le code)
router
  .group(() => {
    router.get('/dashboard', [controllers.CpDashboard, 'index']).as('dashboard')
    router.get('/sessions/create', [controllers.CpSessions, 'create']).as('sessions.create')
    router.post('/sessions', [controllers.CpSessions, 'store']).as('sessions.store')
    router
      .post('/sessions/:id/attendances', [controllers.CpAttendances, 'store'])
      .as('sessions.attendances.store')
    router.get('/sessions/:id', [controllers.CpSessions, 'show']).as('sessions.show')
    router
      .get('/sessions/:id/export', [controllers.CpSessions, 'download'])
      .as('sessions.export')
    router.post('/logout', [controllers.CpAuth, 'destroy']).as('logout')
  })
  .prefix('/cp')
  .as('cp')
  .use(middleware.cpAuth())
