import Alpine from 'alpinejs'
import jsQR from 'jsqr'

Alpine.data('alert', function () {
  return {
    isVisible: false,
    dismiss() {
      this.isVisible = false
    },
    init() {
      setTimeout(() => {
        this.isVisible = true
      }, 80)
      setTimeout(() => {
        this.dismiss()
      }, 5000)
    },
  }
})

Alpine.data('themeToggle', function () {
  return {
    theme: 'light',
    init() {
      this.theme = this.$el.dataset.initialTheme || 'light'
    },
    toggle() {
      const next = this.theme === 'dark' ? 'light' : 'dark'
      this.theme = next
      document.documentElement.setAttribute('data-theme', next)
      document.cookie = `app_theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    },
  }
})

/**
 * Scanner du CP : lit le QR Code personnel des étudiants avec la caméra,
 * ou accepte leur code tapé à la main, puis enregistre la présence.
 */
Alpine.data('attendanceScanner', function () {
  // Objets du navigateur gardés hors d'Alpine (ils ne doivent pas être "réactifs")
  let stream = null
  let frameId = null
  let feedbackTimer = null
  let pausedUntil = 0

  return {
    present: [],
    absent: [],
    closed: false,
    code: '',
    busy: false,
    feedback: null,
    cameraOn: false,
    cameraError: '',

    init() {
      this.present = JSON.parse(this.$el.dataset.present || '[]')
      this.absent = JSON.parse(this.$el.dataset.absent || '[]')
      this.closed = this.$el.dataset.closed === 'true'
    },

    destroy() {
      this.stopCamera()
    },

    feedbackColor() {
      if (!this.feedback) return 'transparent'
      if (this.feedback.status === 'ok') return 'rgba(34, 160, 90, 0.18)'
      if (this.feedback.status === 'already') return 'rgba(230, 160, 30, 0.2)'
      return 'rgba(220, 60, 60, 0.18)'
    },

    showFeedback(status, message) {
      this.feedback = { status, message }
      clearTimeout(feedbackTimer)
      feedbackTimer = setTimeout(() => (this.feedback = null), 4000)
    },

    /** Envoie un code au serveur et met les listes à jour */
    async register(rawCode) {
      const code = String(rawCode || '').trim().toUpperCase()
      if (!code || this.busy || this.closed) return

      this.busy = true
      try {
        const form = this.$refs.form
        // Le formulaire contient déjà le jeton CSRF
        const body = new URLSearchParams(new FormData(form))
        body.set('code', code)

        const response = await fetch(form.action, {
          method: 'POST',
          body,
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        })
        const data = await response
          .json()
          .catch(() => ({ status: 'error', message: 'Réponse inattendue du serveur.' }))

        this.showFeedback(data.status || 'error', data.message || 'Erreur.')

        if ((data.status === 'ok' || data.status === 'already') && data.student) {
          const student = data.student
          this.absent = this.absent.filter((s) => s.id !== student.id)
          if (!this.present.some((s) => s.id === student.id)) {
            this.present = [{ id: student.id, name: student.name, time: student.time }, ...this.present]
          }
        }
        if (navigator.vibrate) navigator.vibrate(data.status === 'ok' ? 80 : [60, 60, 60])
      } catch {
        this.showFeedback('error', 'Connexion impossible. Réessaie.')
      } finally {
        this.busy = false
      }
    },

    /** Saisie manuelle du code */
    async submitManual() {
      await this.register(this.code)
      this.code = ''
      this.$refs.form.elements.code.focus()
    },

    async startCamera() {
      this.cameraError = ''
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        this.cameraError =
          'La caméra ne fonctionne qu’en HTTPS (ou sur localhost). Utilise la saisie du code en attendant.'
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch {
        this.cameraError = 'Impossible d’accéder à la caméra. Autorise-la dans ton navigateur.'
        return
      }

      this.cameraOn = true
      await this.$nextTick()
      const video = this.$refs.video
      video.srcObject = stream
      await video.play()
      this.scanFrame()
    },

    stopCamera() {
      cancelAnimationFrame(frameId)
      if (stream) stream.getTracks().forEach((track) => track.stop())
      stream = null
      this.cameraOn = false
    },

    /** Analyse l'image de la caméra à la recherche d'un QR Code */
    scanFrame() {
      if (!this.cameraOn) return
      const video = this.$refs.video
      const canvas = this.$refs.canvas

      if (video.readyState === video.HAVE_ENOUGH_DATA && !this.busy && Date.now() > pausedUntil) {
        const scale = Math.min(1, 640 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        const context = canvas.getContext('2d', { willReadFrequently: true })
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })

        if (result && result.data) {
          // Petite pause pour laisser le temps de voir le résultat avant le prochain scan
          pausedUntil = Date.now() + 2000
          this.register(result.data)
        }
      }
      frameId = requestAnimationFrame(() => this.scanFrame())
    },
  }
})

Alpine.start()
