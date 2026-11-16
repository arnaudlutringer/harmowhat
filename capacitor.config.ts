import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.harmowhat.app',
  appName: "L'oreille",
  webDir: 'dist',
  plugins: {
    // Rappels (src/notifications/reminders.ts) : l'oreille au trait dans la barre d'état, sur le violet de l'appli.
    // L'icône est android/app/src/main/res/drawable/ic_stat_oreille.xml (dossier android non versionné : à recréer s'il est régénéré).
    LocalNotifications: {
      smallIcon: 'ic_stat_oreille',
      iconColor: '#6C5CE7',
    },
  },
}

export default config
