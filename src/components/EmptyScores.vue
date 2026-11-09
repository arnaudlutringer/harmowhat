<template>
  <!-- Classement encore vide : le podium qui attend son premier joueur. Dans la page (et non un fichier image) pour garder les polices et le thème de l'appli. -->
  <svg class="empty-scores" viewBox="0 28 300 238" role="img" aria-label="Pas encore de score ici. À toi de jouer !">
    <defs>
      <linearGradient id="empty-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c94a" /><stop offset="1" stop-color="#e9a514" /></linearGradient>
      <linearGradient id="empty-silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3ccd8" /><stop offset="1" stop-color="#96a3b4" /></linearGradient>
      <linearGradient id="empty-bronze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a676" /><stop offset="1" stop-color="#c27a40" /></linearGradient>
    </defs>

    <!-- Petites croches autour du podium. -->
    <g class="notes">
      <g transform="translate(36 60) rotate(-10)"><ellipse cx="0" cy="20" rx="8" ry="6" /><path d="M7 19V-4c1 8 11 9 11 18" /></g>
      <g transform="translate(250 42) rotate(8)"><ellipse cx="0" cy="20" rx="7" ry="5" /><path d="M6 19V-2c1 7 9 8 9 16" /></g>
      <g transform="translate(232 92) rotate(-6) scale(0.7)"><ellipse cx="0" cy="20" rx="8" ry="6" /><path d="M7 19V-4c1 8 11 9 11 18" /></g>
    </g>

    <!-- Les places libres, en pointillés. -->
    <circle class="free" cx="87" cy="108" r="15" />
    <circle class="free" cx="150" cy="70" r="15" />
    <circle class="free" cx="213" cy="124" r="15" />

    <!-- Le podium : les couleurs de celui des classements. -->
    <path d="M56 186v-46a10 10 0 0 1 10-10h41a10 10 0 0 1 10 10v46z" fill="url(#empty-silver)" />
    <path d="M119 186V102a10 10 0 0 1 10-10h42a10 10 0 0 1 10 10v84z" fill="url(#empty-gold)" />
    <path d="M183 186v-30a10 10 0 0 1 10-10h41a10 10 0 0 1 10 10v30z" fill="url(#empty-bronze)" />
    <text x="86.5" y="169" class="place">2</text>
    <text x="150" y="150" class="place">1</text>
    <text x="213.5" y="177" class="place">3</text>

    <text x="150" y="216" class="line">Pas encore de score ici.</text>
    <text x="150" y="252" class="call">À toi de jouer !</text>
  </svg>
</template>

<style scoped>
.empty-scores {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 20px auto 8px;
}
.notes {
  fill: var(--ion-color-primary);
  opacity: 0.35;
}
.notes path {
  fill: none;
  stroke: var(--ion-color-primary);
  stroke-width: 2.6;
  stroke-linecap: round;
}
.free {
  fill: none;
  stroke: var(--ion-color-medium);
  stroke-width: 2;
  stroke-dasharray: 5 5;
  opacity: 0.7;
}
text {
  text-anchor: middle;
}
.place {
  fill: #fff;
  font-size: 26px;
  font-weight: 700;
}
.line {
  fill: var(--ion-text-color);
  font-size: 19px;
  font-weight: 600;
}
.call {
  fill: var(--ion-color-primary);
  font-family: 'Dancing Script', cursive;
  font-size: 32px;
  font-weight: 700;
}
</style>
