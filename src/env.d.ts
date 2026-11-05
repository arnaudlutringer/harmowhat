/// <reference types="vite/client" />
/** Date de construction de l'appli (vite.config.ts). */
declare const __BUILD_TIME__: string
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
