// Inteligência artificial do CPU
(function () {
  class AICtrl {
    constructor(level) {
      this.level = level || 2; // 1 fácil, 2 normal, 3 difícil
      this.h = {}; this.p = {}; this.plan = null; this.timer = 0; this.react = 0;
    }
    held(b) { return !!this.h[b]; }
    pressed(b) { return !!this.p[b]; }
    consume(b) { this.p[b] = false; }
    tap(b) { this.p[b] = true; }
    update(me, opp, game) {
      this.p = {};
      const dist = Math.abs(opp.x - me.x);
      const fwd = me.facing === 1 ? 'right' : 'left', back = me.facing === 1 ? 'left' : 'right';
      const lv = this.level;
      const rnd = Math.random;
      // defesa: reage a ataques
      const oppAttacking = (opp.state === 'attack' || opp.state === 'special' || (opp.move && opp.state === 'jump'));
      const threats = game.entities.some(e => e.owner === opp && Math.abs(e.x - me.x) < 90);
      if ((oppAttacking && dist < 90) || threats) {
        if (this.react <= 0) this.react = [0, 14, 8, 4][lv] + (rnd() * 6 | 0);
        this.react--;
        if (this.react <= 0 && rnd() < [0, 0.35, 0.6, 0.85][lv]) {
          this.h = { [back]: true, down: opp.move && opp.move.def && opp.move.def.level === 'low' };
          return;
        }
      } else this.react = 0;

      if (--this.timer <= 0 || !this.plan) {
        this.timer = 12 + (rnd() * 20 | 0);
        const r = rnd();
        if (me.meter >= 100 && dist < 160 && r < 0.5) this.plan = 'super';
        else if (dist > 150) this.plan = r < 0.45 ? 'approach' : (r < 0.8 ? 'zone' : 'jumpin');
        else if (dist > 60) this.plan = r < 0.45 ? 'approach' : (r < 0.65 ? 'zone' : (r < 0.8 ? 'jumpin' : 'fwdSpecial'));
        else this.plan = r < 0.5 ? 'pressure' : (r < 0.7 ? 'retreat' : (r < 0.85 ? 'sweep' : 'downSpecial'));
      }
      this.h = {};
      if (!me.canAct()) return;
      // anti-aéreo
      if (opp.state === 'jump' && dist < 70 && rnd() < 0.08 * lv) {
        const sp = me.ch.specials.fwd.type === 'rising' ? 'fwd' : null;
        if (sp) { this.h[fwd] = true; this.tap('power'); } else { this.h.down = true; this.tap('punch'); }
        return;
      }
      switch (this.plan) {
        case 'approach': this.h[fwd] = true; if (dist < 50) this.plan = 'pressure'; break;
        case 'retreat': this.h[back] = true; break;
        case 'zone': if (rnd() < 0.06 * lv) { this.tap('power'); this.plan = 'wait'; } break;
        case 'jumpin': this.h.up = true; this.h[fwd] = true; this.plan = 'airatk'; break;
        case 'airatk': if (me.state === 'jump' && dist < 50 && rnd() < 0.3) this.tap('kick'); break;
        case 'fwdSpecial': this.h[fwd] = true; this.tap('power'); this.plan = 'wait'; break;
        case 'downSpecial': this.h.down = true; this.tap('power'); this.plan = 'wait'; break;
        case 'sweep': this.h.down = true; if (rnd() < 0.2) { this.tap('kick'); this.plan = 'wait'; } break;
        case 'pressure':
          if (dist > 40) this.h[fwd] = true;
          else if (rnd() < 0.08 * lv + 0.04) { const k = rnd(); this.tap(k < 0.5 ? 'punch' : 'kick'); if (rnd() < 0.3) this.h.down = true; }
          break;
        case 'super': this.h.punch = true; this.tap('power'); this.tap('punch'); this.plan = 'wait'; break;
      }
    }
  }
  window.AICtrl = AICtrl;
})();
