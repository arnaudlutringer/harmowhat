import { ref, watch, onBeforeUnmount, type Ref } from 'vue'

/**
 * Niveaux Impossible des jeux de lecture : la portée s'efface `ms` millisecondes après le début
 * de la question, et réapparaît avec la réponse. Sans durée, elle reste affichée.
 */
export function useFlash(
  quiz: { question: Ref<unknown>; hasListened: Ref<boolean>; feedback: Ref<unknown> },
  ms: number | undefined,
) {
  const hidden = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  if (ms === undefined) return { hidden }
  watch(
    () => [quiz.question.value, quiz.hasListened.value, quiz.feedback.value] as const,
    ([, open, feedback]) => {
      clearTimeout(timer)
      hidden.value = false
      if (open && !feedback) timer = setTimeout(() => (hidden.value = true), ms)
    },
    { immediate: true },
  )
  onBeforeUnmount(() => clearTimeout(timer))
  return { hidden }
}
