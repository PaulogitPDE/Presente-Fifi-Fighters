// Lógica dos lutadores, golpes e entidades (projéteis, invocações, armadilhas)
(function () {
  const GROUND = 196;
  const GRAV = 0.42;
  const MAX_HP = 1000;

  // Golpes normais
  const NORMALS = {
    punch: { startup: 4, active: 3, recovery: 9, dmg: 50, box: [8, -50, 24, 12], stun: 14, level: 'mid', push: 2.2 },
    kick: { startup: 7, active: 4, recovery: 14, dmg: 72, box: [10, -40, 26, 16], stun: 18, level: 'mid', push: 3 },
    cpunch: { startup: 4, active: 3, recovery: 9, dmg: 40, box: [8, -32, 24, 12], stun: 13, level: 'mid', push: 2 },
    ckick: { startup: 8, active: 4, recovery: 20, dmg: 62, box: [10, -9, 28, 9], stun: 18, level: 'low', knockdown: true, push: 2 },
    jpunch: { startup: 3, active: 7, recovery: 4, dmg: 60, box: [6, -40, 24, 20], stun: 15, level: 'high', push: 2 },
    jkick: { startup: 4, active: 9, recovery: 4, dmg: 72, box: [6, -24, 26, 18], stun: 17, level: 'high', push: 2.5 }
  };

  const THROW = { startup: 15, active: 1, recovery: 15, pose: 'push' };
  function game_particle(f, type) { if (window.G && G.particle) G.particle(f.x - f.facing * 8, GROUND - 2, type); }

  class HumanCtrl {
    constructor(p) { this.p = p; }
    held(b) { return Input.held(this.p, b); }
    pressed(b, buf) { return Input.pressed(this.p, b, buf || 0); }
    consume(b) { Input.consume(this.p, b); }
    update() {}
  }

  class Fighter {
    constructor(ch, side, ctrl) {
      this.ch = ch; this.side = side; this.ctrl = ctrl;
      this.canvas = Sprites.newCanvas();
      this.stats = ch.stats;
      this.reset(side);
    }
    reset(side) {
      this.x = Stages.WIDTH / 2 + (side === 0 ? -70 : 70);
      this.y = 0; this.vx = 0; this.vy = 0;
      this.facing = side === 0 ? 1 : -1;
      this.hp = MAX_HP; this.dispHp = MAX_HP;
      this.meter = this.meter || 0;
      this.state = 'idle'; this.t = 0; this.st = 0;
      this.move = null; this.stun = 0; this.inv = 0;
      this.crouching = false; this.combo = 0; this.comboTimer = 0;
      this.buff = 0; this.poison = 0; this.vuln = 0;
      this.cool = {}; this.lastDmg = 0; this.lastDmgT = -999;
      this.knock = false; this.flashT = 0; this.texts = [];
      this.hitThisMove = 0; this.anim = 0;
      this.stunMeter = 0; this.stunDecayT = 0; this.dizzyNext = false; this.dizzyT = 0;
      this.lastTap = { left: -99, right: -99 }; this.dashT = 0; this.dashDir = 0;
      this.comboDmg = 0; this.holder = null;
      if (!this.rec) this.rec = { hits: 0, dmg: 0, maxCombo: 0, specials: 0, supers: 0, throws: 0, blocks: 0 };
    }
    get speedMul() { return this.buff > 0 && this.buffDef ? this.buffDef.speedMul : 1; }
    get dmgMul() { return this.buff > 0 && this.buffDef ? this.buffDef.dmgMul : 1; }
    onGround() { return this.y >= 0; }
    height() { return (this.crouching || this.state === 'knockdown' ? 36 : 58) * (this.ch.scale || 1); }
    hurtbox() {
      if (this.state === 'knockdown' || this.state === 'ko') return { x: this.x - 34, y: GROUND + this.y - 14, w: 68, h: 14 };
      const h = this.height();
      const hw = 12.5;
      return { x: this.x - hw, y: GROUND + this.y - h, w: hw * 2, h };
    }
    canAct() { return ['idle', 'walk', 'crouch', 'jump'].includes(this.state) && !(this.state === 'jump' && this.move); }
    forwardHeld() { return this.ctrl.held(this.facing === 1 ? 'right' : 'left'); }
    backHeld() { return this.ctrl.held(this.facing === 1 ? 'left' : 'right'); }
    say(s, color) { this.texts = this.texts.filter(x => x.s !== s).slice(-1); this.texts.push({ s, t: 0, color: color || '#ffffff' }); }

    update(game) {
      const opp = game.other(this);
      this.t++; this.st++; this.anim++;
      this.ctrl.update && this.ctrl.update(this, opp, game);
      if (this.inv > 0) this.inv--;
      if (this.buff > 0) this.buff--;
      if (this.vuln > 0) this.vuln--;
      if (this.flashT > 0) this.flashT--;
      if (this.comboTimer > 0) this.comboTimer--; else this.combo = 0;
      for (const k in this.cool) if (this.cool[k] > 0) this.cool[k]--;
      if (this.poison > 0) { this.poison--; if (this.poison % 3 === 0 && this.hp > 1 && game.fighting) this.hp -= 1; }
      this.texts = this.texts.filter(x => ++x.t < 60);
      if (this.stunDecayT > 0) this.stunDecayT--; else this.stunMeter = Math.max(0, this.stunMeter - 0.25);
      this.dispHp += (this.hp - this.dispHp) * 0.08;

      if (!game.fighting) { this.physics(game); return; }

      const c = this.ctrl;
      switch (this.state) {
        case 'idle': case 'walk': case 'crouch': {
          this.face(opp);
          if (this.tryAttack(game, opp)) break;
          if (this.tryDash()) break;
          const spd = 1.7 * this.stats.speed * this.speedMul;
          if (c.held('up')) {
            this.state = 'jump'; this.vy = -7.6 * this.stats.jump; this.st = 0;
            this.vx = (c.held('right') ? 1 : c.held('left') ? -1 : 0) * 2.3 * this.stats.speed * this.speedMul;
            Sound.play('jump'); this.crouching = false;
          } else if (c.held('down')) { this.state = 'crouch'; this.crouching = true; this.vx = 0; }
          else {
            this.crouching = false;
            const dir = (c.held('right') ? 1 : 0) - (c.held('left') ? 1 : 0);
            this.vx = dir * spd * (dir === this.facing ? 1 : 0.8);
            this.state = dir ? 'walk' : 'idle';
          }
          break;
        }
        case 'jump':
          if (this.move) {
            const d = this.move.def;
            if (++this.move.f > d.startup + d.active + d.recovery + 6) this.move = null;
          } else this.tryAttack(game, opp);
          break;
        case 'attack': this.updateNormal(game, opp); break;
        case 'special': this.updateSpecial(game, opp); break;
        case 'hit': case 'block':
          this.stun--; this.vx *= 0.85;
          if (this.stun <= 0) {
            if (this.dizzyNext && this.state === 'hit') { this.dizzyNext = false; this.state = 'dizzy'; this.dizzyT = 150; this.st = 0; this.crouching = false; this.say('TONTO!', '#ffd400'); Sound.play('ko'); }
            else { this.state = this.crouching ? 'crouch' : 'idle'; this.st = 0; }
          }
          break;
        case 'dizzy': {
          this.vx = 0;
          const mash = ['punch', 'kick', 'power', 'left', 'right', 'up', 'down'].some(b => c.pressed(b, 0));
          this.dizzyT -= mash ? 6 : 1;
          if (this.dizzyT <= 0) { this.state = 'idle'; this.st = 0; this.stunMeter = 0; }
          break;
        }
        case 'dash':
          this.dashT--;
          this.vx = this.dashDir * (this.dashDir === this.facing ? 4.4 : 3.6) * this.stats.speed;
          if (this.dashDir !== this.facing && this.st < 7) this.inv = 1;
          if (this.dashT <= 0) { this.state = 'idle'; this.vx = 0; this.st = 0; }
          break;
        case 'throw': {
          const m = this.move; m.f++;
          const o = this.holder;
          if (m.f <= 14 && o && o.state === 'thrown') {
            o.x = this.x + this.facing * 22; o.vx = 0;
            // escapar do agarrão: soco + chute juntos
            if (m.f <= 9 && ((o.ctrl.pressed('punch', 3) && o.ctrl.held('kick')) || (o.ctrl.pressed('kick', 3) && o.ctrl.held('punch')))) {
              o.ctrl.consume('punch'); o.ctrl.consume('kick');
              o.state = 'block'; o.stun = 14; o.vx = this.facing * 3; o.holder = null; o.st = 0;
              this.state = 'block'; this.stun = 14; this.vx = -this.facing * 3; this.move = null; this.st = 0;
              o.say('ESCAPOU!', '#9ff0ff'); Sound.play('block'); game.particle((this.x + o.x) / 2, GROUND - 50, 'block');
              break;
            }
          }
          if (m.f === 15 && o && o.state === 'thrown') {
            o.state = 'idle'; o.holder = null;
            o.receiveDamage(game, this, { dmg: 110, stun: 30, knockdown: true, special: false, push: 3 }, true);
            this.rec.throws++;
            game.shake(4);
          }
          if (m.f > 30) { this.move = null; this.state = 'idle'; this.st = 0; }
          break;
        }
        case 'thrown':
          if (!this.holder || this.holder.state !== 'throw') { this.state = 'idle'; this.holder = null; }
          break;
        case 'airhit':
          if (this.onGround() && this.vy >= 0 && this.st > 3) { this.state = 'knockdown'; this.st = 0; this.vx = 0; Sound.play('land'); game.shake(3); }
          break;
        case 'knockdown':
          this.vx *= 0.8; this.inv = 2;
          if (this.st > 40) { this.state = 'getup'; this.st = 0; }
          break;
        case 'getup':
          this.inv = 2;
          if (this.st > 16) { this.state = 'idle'; this.st = 0; this.inv = 8; }
          break;
      }
      this.physics(game);
    }

    physics(game) {
      if (this.state === 'ko') { this.vx *= 0.9; }
      this.x += this.vx;
      if (!this.onGround() || this.vy < 0) {
        this.vy += GRAV; this.y += this.vy;
        if (this.y >= 0) {
          this.y = 0; this.vy = 0;
          if (this.state === 'jump') { this.state = 'idle'; this.move = null; this.vx = 0; Sound.play('land'); }
          if (this.state === 'special' && this.move && this.move.def.type === 'rising' && this.move.f > this.move.def.startup + 4) { this.endMove(); }
        }
      }
      this.x = Math.max(16, Math.min(Stages.WIDTH - 16, this.x));
    }

    face(opp) { this.facing = opp.x >= this.x ? 1 : -1; }

    tryDash() {
      const c = this.ctrl;
      for (const dir of ['left', 'right']) {
        if (c.pressed(dir, 0)) {
          if (this.t - this.lastTap[dir] < 12) {
            this.lastTap[dir] = -99;
            this.state = 'dash'; this.st = 0; this.dashDir = dir === 'right' ? 1 : -1;
            this.dashT = this.dashDir === this.facing ? 14 : 16; this.crouching = false;
            game_particle(this, 'dust');
            Sound.play('whoosh');
            return true;
          }
          this.lastTap[dir] = this.t;
        }
      }
      return false;
    }
    canBeThrown() {
      return this.onGround() && this.inv <= 0 && ['idle', 'walk', 'crouch', 'attack', 'dash'].includes(this.state);
    }
    tryThrow(game, opp) {
      const c = this.ctrl;
      const both = (c.pressed('punch', 2) && c.held('kick')) || (c.pressed('kick', 2) && c.held('punch'));
      if (!both) return false;
      if (Math.abs(opp.x - this.x) > 46 || !opp.canBeThrown()) return false;
      c.consume('punch'); c.consume('kick');
      this.state = 'throw'; this.st = 0; this.vx = 0; this.crouching = false;
      this.move = { def: THROW, f: 0, throwMove: true };
      this.holder = opp;
      opp.state = 'thrown'; opp.st = 0; opp.vx = 0; opp.move = null; opp.holder = this; opp.crouching = false;
      this.say('AGARRAO!', '#ffffff'); Sound.play('whoosh');
      return true;
    }

    tryAttack(game, opp) {
      const c = this.ctrl;
      const air = this.state === 'jump';
      if (!air && this.tryThrow(game, opp)) return true;
      // SUPER pelo botão dedicado do controle
      if (!air && this.meter >= 100 && c.pressed('super', 3)) {
        c.consume('super'); this.meter = 0; this.startSpecial(game, this.ch.specials.super, true); return true;
      }
      // SUPER: soco + poder juntos com barra cheia
      if (!air && this.meter >= 100 && ((c.pressed('power', 4) && c.held('punch')) || (c.pressed('punch', 4) && c.held('power')))) {
        c.consume('power'); c.consume('punch');
        this.meter = 0; this.startSpecial(game, this.ch.specials.super, true); return true;
      }
      if (!air && c.pressed('power', 3)) {
        c.consume('power');
        let key = 'n';
        if (c.held('down')) key = 'down'; else if (this.forwardHeld()) key = 'fwd';
        const def = this.ch.specials[key];
        if (this.cool[key] > 0) { this.say('ESPERA...', '#aaaaaa'); return false; }
        this.startSpecial(game, def, false, key); return true;
      }
      if (c.pressed('punch', 2)) { c.consume('punch'); this.startNormal(air ? 'jpunch' : (c.held('down') ? 'cpunch' : 'punch')); return true; }
      if (c.pressed('kick', 2)) { c.consume('kick'); this.startNormal(air ? 'jkick' : (c.held('down') ? 'ckick' : 'kick')); return true; }
      return false;
    }

    startNormal(kind) {
      const def = NORMALS[kind];
      this.move = { kind, def, f: 0, hit: false, normal: true };
      if (kind[0] !== 'j') { this.state = 'attack'; this.vx = 0; this.crouching = kind[0] === 'c'; }
      Sound.play('whoosh');
    }

    updateNormal(game, opp) {
      const m = this.move; m.f++;
      const d = m.def;
      if (m.f > d.startup + d.active + d.recovery) { this.endMove(); return; }
      // SUPER apertando soco + poder quase juntos
      const c0 = this.ctrl;
      if (m.kind === 'punch' && m.f <= 6 && this.meter >= 100 && c0.pressed('power', 4) && c0.held('punch')) {
        c0.consume('power'); this.meter = 0; this.startSpecial(game, this.ch.specials.super, true); return;
      }
      // agarrão: o segundo botão chegou logo depois do primeiro (que já tinha começado o golpe)
      if ((m.kind === 'punch' || m.kind === 'kick') && m.f <= 4 && !m.hit && this.tryThrow(game, opp)) return;
      // cancelar em especial ao acertar
      if (m.hit && m.f <= d.startup + d.active + 6) {
        const c = this.ctrl;
        if (c.pressed('power', 3)) {
          if (this.tryAttack(game, opp)) return;
        }
      }
    }

    activeHitbox() {
      const m = this.move; if (!m) return null;
      if (m.normal) {
        const d = m.def;
        if (m.f < d.startup || m.f >= d.startup + d.active || m.hit) return null;
        const s = this.ch.scale || 1;
        const [bx, by, bw, bh] = d.box;
        const x = this.facing === 1 ? this.x + bx * s : this.x - (bx + bw) * s;
        return { x, y: GROUND + this.y + by * s, w: bw * s, h: bh * s, dmg: d.dmg, stun: d.stun, level: d.level, knockdown: d.knockdown, push: d.push, normal: true };
      }
      const d = m.def;
      if (d.type === 'rush' && m.f >= d.startup && m.f < d.startup + d.dur) {
        const every = Math.floor(d.dur / d.hits);
        if (m.hits < d.hits && (m.f - d.startup) - m.lastHitF >= every) {
          const x = this.facing === 1 ? this.x + 4 : this.x - 30;
          return { x, y: GROUND + this.y - 50, w: 26, h: 48, dmg: d.dmg, stun: 20, level: 'mid', push: 1, multi: true, knockdown: m.hits === d.hits - 1, special: true };
        }
      }
      if (d.type === 'rising' && m.f >= d.startup && m.f < d.startup + 18 && !m.hit) {
        const x = this.facing === 1 ? this.x : this.x - 22;
        return { x, y: GROUND + this.y - 74, w: 22, h: 60, dmg: d.dmg, stun: 30, level: 'mid', knockdown: true, launch: true, special: true };
      }
      if (d.type === 'counterHit' && m.f === 1) {
        return { x: this.facing === 1 ? this.x : this.x - 40, y: GROUND + this.y - 60, w: 40, h: 60, dmg: d.dmg, stun: 30, knockdown: true, unblockable: true, special: true };
      }
      return null;
    }

    startSpecial(game, def, isSuper, key) {
      this.state = 'special'; this.vx = 0; this.crouching = false;
      this.move = { def, f: 0, hits: 0, lastHitF: -999, isSuper, key, spawned: 0 };
      if (def.cooldown || ['heal', 'undo', 'buff'].includes(def.type)) this.cool[key] = def.cooldown || (def.type === 'buff' ? 600 : 480);
      if (key === 'down' && def.type === 'trap') this.cool[key] = 200;
      if (isSuper) { game.superFlash(this, def); Sound.play('super'); this.inv = def.startup + 4; this.rec.supers++; }
      else { Sound.play('special'); this.rec.specials++; }
      this.say(def.name, isSuper ? '#ffd400' : '#9ff0ff');
    }

    endMove() {
      this.move = null; this.state = this.onGround() ? 'idle' : 'jump'; this.st = 0; this.vx = 0;
      if (this.onGround()) this.crouching = false;
    }

    updateSpecial(game, opp) {
      const m = this.move, d = m.def; m.f++;
      // SUPER quando o poder sai um pouco antes do soco
      if (!m.isSuper && m.f <= 5 && this.meter >= 100 && this.ctrl.pressed('punch', 5) && this.ctrl.held('power')) {
        this.ctrl.consume('punch'); this.meter = 0; this.texts = []; this.startSpecial(game, this.ch.specials.super, true); return;
      }
      const S = d.startup;
      const total = S + (d.dur || d.window || 10) + d.recovery;
      switch (d.type) {
        case 'projectile':
          if (m.f === S) {
            const n = d.count || 1;
            for (let i = 0; i < n; i++) game.spawn(new Projectile(this, d, i, n));
            Sound.play('fireball');
          }
          break;
        case 'volley':
          if (m.f >= S && m.f < S + d.count * 6 && (m.f - S) % 6 === 0) { game.spawn(new Projectile(this, Object.assign({}, d, { w: 14, h: 12, stun: 16 }), 0, 1, (m.f - S) / 6)); Sound.play('fireball'); }
          break;
        case 'rain':
          if (m.f >= S && m.f < S + d.count * 5 && (m.f - S) % 5 === 0) game.spawn(new RainDrop(this, opp, d, (m.f - S) / 5));
          break;
        case 'rush':
          if (m.f >= S && m.f < S + d.dur) {
            this.vx = this.facing * d.speed * this.speedMul;
            if (d.fx === 'dust' && m.f % 3 === 0) game.particle(this.x - this.facing * 10, GROUND - 2, 'dust');
            if (d.super) this.inv = 2;
          } else this.vx = 0;
          break;
        case 'rising':
          if (m.f === S) { this.vy = d.vy; this.y = -1; this.vx = this.facing * d.vx; this.inv = 10; }
          if (m.f > S + 40 && this.onGround()) { this.endMove(); return; }
          break;
        case 'counter':
          // janela de contra-ataque: tratada em takeHit
          if (m.f > S + d.window && !m.countered) { /* recuperação */ }
          break;
        case 'heal':
          if (m.f === S) { this.hp = Math.min(MAX_HP, this.hp + d.amount); Sound.play('heal'); game.particle(this.x, GROUND + this.y - 60, 'heal'); if (d.hearts) for (let i = 0; i < 5; i++) game.particle(this.x + (i - 2) * 8, GROUND - 50 - i * 3, 'heart'); }
          break;
        case 'undo':
          if (m.f === S) {
            if (this.lastDmg > 0 && game.time - this.lastDmgT < 240) { this.hp = Math.min(MAX_HP, this.hp + this.lastDmg); this.say('-' + this.lastDmg + ' APAGADO', '#9ff0ff'); this.lastDmg = 0; Sound.play('heal'); }
            else { this.say('NADA PRA APAGAR', '#aaaaaa'); }
            game.particle(this.x, GROUND - 60, 'trash');
          }
          break;
        case 'buff':
          if (m.f === S) { this.buff = d.dur; this.buffDef = d; Sound.play('heal'); this.say('MONSTER!', d.color); }
          break;
        case 'debuff':
          if (m.f === S) { game.spawn(new Projectile(this, d, 0, 1)); Sound.play('fireball'); }
          break;
        case 'teleport':
          if (m.f === S) {
            game.particle(this.x, GROUND - 30, 'poof');
            this.x = Math.max(20, Math.min(Stages.WIDTH - 20, opp.x - opp.facing * 34));
            if (Math.abs(this.x - opp.x) < 20) this.x = opp.x + (this.x < opp.x ? -30 : 30);
            this.face(opp); this.inv = 12;
            game.particle(this.x, GROUND - 30, 'poof');
          }
          break;
        case 'trap':
          if (m.f === S) game.spawn(new Trap(this, d));
          break;
        case 'summon':
          if (m.f === S) {
            if (d.entity === 'crowd') { for (let i = 0; i < d.hits; i++) game.spawn(new Summon(this, d, i)); }
            else if (d.entity === 'cats') { game.spawn(new Summon(this, d, 0)); game.spawn(new Summon(this, d, 1)); }
            else game.spawn(new Summon(this, d, 0));
            if (d.entity === 'dog') Sound.play('bark');
            if (d.text) this.say(d.text, '#ffffff');
          }
          break;
        case 'beam':
          if (m.f === S) { game.spawn(new Beam(this, d)); }
          break;
      }
      if (m.f >= total && this.onGround()) this.endMove();
    }

    // Recebe um golpe. Retorna 'hit'|'block'|'miss'|'counter'
    takeHit(game, attacker, hb, fromProj) {
      if (this.inv > 0 || this.state === 'ko') return 'miss';
      if (!game.fighting && !game.training) return 'miss'; // depois do KO/tempo ninguém mais apanha
      // contra-golpe
      if (this.state === 'special' && this.move && this.move.def.type === 'counter') {
        const d = this.move.def, f = this.move.f;
        if (f >= d.startup && f <= d.startup + d.window && !this.move.countered) {
          this.move.countered = true;
          this.say(d.text, '#ffd400');
          Sound.play('super');
          game.freeze(14); game.flash('#ffffff');
          if (fromProj && d.reflect) {
            fromProj.owner = this; fromProj.vx = -fromProj.vx * 1.3; fromProj.reflected = true; fromProj.hitsLeft = 1;
            return 'counter';
          }
          // teleporta e acerta
          this.x = attacker.x + (attacker.x > this.x ? -26 : 26);
          this.face(attacker);
          this.inv = 20;
          attacker.receiveDamage(game, this, { dmg: d.dmg, stun: 30, knockdown: true, special: true }, true);
          this.move.f = d.startup + d.window; // vai para a recuperação
          return 'counter';
        }
      }
      const blocking = this.isBlocking(attacker, hb);
      if (blocking && !hb.unblockable) {
        const chip = hb.special ? Math.round(hb.dmg * 0.15) : 0;
        if (chip) this.hp = Math.max(1, this.hp - chip);
        this.state = 'block'; this.stun = Math.round((hb.stun || 14) * 0.7); this.st = 0;
        this.vx = -this.facing * (hb.push || 2) * 1.2;
        this.meter = Math.min(100, this.meter + 3);
        Sound.play('block'); this.rec.blocks++;
        game.particle((this.x + attacker.x) / 2 + this.facing * 4, GROUND + this.y - 40, 'block');
        game.freeze(4);
        return 'block';
      }
      this.receiveDamage(game, attacker, hb);
      return 'hit';
    }

    isBlocking(attacker, hb) {
      if (!this.onGround()) return false;
      if (!['idle', 'walk', 'crouch', 'block'].includes(this.state)) return false;
      const away = this.ctrl.held(attacker.x > this.x ? 'left' : 'right');
      if (!away && this.state !== 'block') return false;
      if (!away) return false;
      const crouch = this.ctrl.held('down');
      if (hb.level === 'low' && !crouch) return false;
      if (hb.level === 'high' && crouch) return false;
      this.crouching = crouch;
      return true;
    }

    receiveDamage(game, attacker, hb, noScale) {
      // combo só continua se o oponente ainda estava atordoado pelo golpe anterior
      const inCombo = ['hit', 'airhit', 'knockdown', 'thrown', 'dizzy'].includes(this.state) && attacker.comboTimer > 0;
      if (!inCombo) { attacker.combo = 0; attacker.comboDmg = 0; }
      const scale = noScale ? 1 : Math.max(0.45, Math.pow(0.88, attacker.combo));
      // contra-golpe: acertar o oponente durante a preparação de um golpe
      const counterHit = this.move && (this.state === 'attack' || this.state === 'special') && !this.move.isSuper && this.move.f < this.move.def.startup + (this.move.def.active || 2);
      let dmg = hb.dmg * attacker.stats.power * attacker.dmgMul / this.stats.defense * scale * (this.vuln > 0 ? 1.3 : 1) * (counterHit ? 1.25 : 1);
      dmg = Math.max(1, Math.round(dmg));
      if (game.training && game.training.noKO) dmg = Math.min(dmg, Math.max(0, this.hp - 1));
      this.hp = Math.max(0, this.hp - dmg);
      this.lastDmg = dmg; this.lastDmgT = game.time;
      attacker.combo++; attacker.comboTimer = 50; attacker.comboDmg += dmg;
      attacker.rec.hits++; attacker.rec.dmg += dmg; attacker.rec.maxCombo = Math.max(attacker.rec.maxCombo, attacker.combo);
      if (attacker.combo >= 2) game.comboText(attacker, attacker.combo, attacker.comboDmg);
      if (game.onHit) game.onHit(attacker, this, dmg, counterHit);
      if (game.fighters) { // vibra o celular e o controle de quem apanhou
        const fi = game.fighters.indexOf(this), ms = dmg >= 65 ? 60 : 25;
        if (fi === 0 || game.mode === '2p') { if (window.Remote) Remote.vibrate(fi, ms); Input.vibratePad(fi, ms * 2); }
      }
      if (counterHit) attacker.say('CONTRA-GOLPE!', '#ff9a3a');
      if (!game.firstAttack && game.fighting && !game.training) { game.firstAttack = attacker; attacker.say('PRIMEIRO GOLPE!', '#ffd400'); }
      // tonteira
      this.stunMeter += dmg * (hb.special ? 0.1 : 0.16); this.stunDecayT = 90;
      if (this.state === 'dizzy') { this.stunMeter = 0; this.dizzyNext = false; }
      else if (this.stunMeter >= 100 && !hb.knockdown && !hb.launch) { this.dizzyNext = true; this.stunMeter = 0; }
      attacker.meter = Math.min(100, attacker.meter + (hb.special ? 5 : 8));
      this.meter = Math.min(100, this.meter + 4);
      if (hb.poison) { this.poison = hb.poison; this.say('FEBRE!', '#88ff66'); }
      if (hb.vuln) { this.vuln = hb.vuln; this.say('VISTORIADO!', '#ffd400'); }
      this.move = null;
      const heavy = dmg >= 65;
      Sound.play(heavy ? 'hitHeavy' : 'hitLight');
      game.particle((this.x + attacker.x) / 2 + this.facing * 4, GROUND + this.y - 40 + (hb.level === 'low' ? 30 : 0), heavy ? 'hitBig' : 'hit');
      game.freeze(heavy ? 8 : 5);
      if (heavy) game.shake(heavy ? 4 : 2);
      const dir = attacker.x < this.x ? 1 : -1;
      if (this.hp <= 0) {
        this.state = 'ko'; this.vy = -5; this.y = Math.min(this.y, -1); this.vx = dir * 2.5; this.st = 0;
        game.onKO(this, attacker);
        return;
      }
      if (hb.knockdown || !this.onGround() || hb.launch) {
        this.state = 'airhit'; this.vy = hb.launch ? -6 : -4; this.y = Math.min(this.y, -1); this.vx = dir * 2.2; this.st = 0;
        this.crouching = false; this.dizzyNext = false;
      } else {
        this.state = 'hit'; this.stun = hb.stun || 14; this.st = 0; this.vx = dir * (hb.push || 2);
      }
    }

    pose() {
      const ch = this.ch, m = this.move;
      const t = this.anim;
      switch (this.state) {
        case 'idle': return Poses.idle(ch, t);
        case 'walk': return Poses.walk(ch, t, this.vx * this.facing > 0 ? 1 : -1);
        case 'crouch': return Poses.crouch(ch, t);
        case 'jump':
          if (m && m.normal) return this.normalPose();
          return Poses.jump(ch, this.vy);
        case 'attack': return this.normalPose();
        case 'special': {
          const d = m.def, S = d.startup, A = d.dur || d.window || 12;
          let p;
          if (m.f < S) p = Poses.special(ch, d.pose, 0, m.f / S);
          else if (m.f < S + A) p = Poses.special(ch, d.pose, 1, (m.f - S) / A);
          else p = Poses.special(ch, d.pose, 2, Math.min(1, (m.f - S - A) / d.recovery));
          if (d.prop) p.prop = d.prop;
          if (d.type === 'rising' && !this.onGround() && m.f > S + 14) p = Poses.jump(ch, 1);
          return p;
        }
        case 'block': return Poses.block(ch, this.crouching);
        case 'hit': return Poses.hit(ch, Math.min(1, this.stun / 10), this.crouching);
        case 'dizzy': { const p = Poses.hit(ch, 0.4 + Math.sin(t / 8) * 0.3, false); p.headTilt = Math.sin(t / 8) * 10; return p; }
        case 'dash': return Poses.walk(ch, t * 2, this.dashDir === this.facing ? 1 : -1);
        case 'throw': return Poses.special(ch, 'push', this.move && this.move.f < 15 ? 1 : 2, 0.5);
        case 'thrown': return Poses.hit(ch, 1, false);
        case 'airhit': return Poses.airHit(ch);
        case 'knockdown': return Poses.lying();
        case 'getup': return Poses.getUp(this.st / 16);
        case 'ko': return this.onGround() && this.st > 10 ? Poses.lying() : Poses.airHit(ch);
        case 'win': return Poses.victory(ch, this.st);
        case 'intro': return Poses.intro(ch, this.st);
      }
      return Poses.idle(ch, t);
    }
    sheetState() {
      const m = this.move;
      const ph = (d, f, A) => f < d.startup ? [0, f / d.startup] : f < d.startup + A ? [1, (f - d.startup) / A] : [2, Math.min(1, (f - d.startup - A) / (d.recovery || 1))];
      switch (this.state) {
        case 'idle': return { kind: 'idle' };
        case 'walk': return { kind: 'walk', dir: this.vx * this.facing > 0 ? 1 : -1 };
        case 'crouch': return { kind: 'crouch' };
        case 'jump':
          if (m && m.normal) { const [phase, k] = ph(m.def, m.f, m.def.active); return { kind: m.kind, phase, k }; }
          return { kind: 'jump', up: this.vy < 0 };
        case 'attack': { const [phase, k] = ph(m.def, m.f, m.def.active); return { kind: m.kind, phase, k }; }
        case 'special': {
          const d = m.def, [phase, k] = ph(d, m.f, d.dur || d.window || 12);
          if (d.type === 'rising' && !this.onGround() && m.f > d.startup + 14) return { kind: 'jump', up: false };
          return { kind: 'special', pose: d.pose, phase, k, slot: m.isSuper ? 'super' : m.key };
        }
        case 'block': return { kind: 'block', crouch: this.crouching };
        case 'hit': return { kind: 'hit', k: Math.min(1, this.stun / 10), crouch: this.crouching };
        case 'dizzy': return { kind: 'dizzy' };
        case 'dash': return this.dashDir === this.facing ? { kind: 'dash' } : { kind: 'backdash' };
        case 'throw': return { kind: 'throw', phase: this.move && this.move.f < 15 ? 1 : 2 };
        case 'thrown': return { kind: 'thrown' };
        case 'airhit': return { kind: 'airhit' };
        case 'knockdown': return { kind: 'lying' };
        case 'getup': return { kind: 'getup', k: this.st / 16 };
        case 'ko': return this.onGround() && this.st > 10 ? { kind: 'lying' } : { kind: 'airhit' };
        case 'win': return { kind: 'win' };
        case 'intro': return { kind: this.st < 50 ? 'intro' : 'idle' };
      }
      return { kind: 'idle' };
    }
    normalPose() {
      const m = this.move, d = m.def;
      let phase, k;
      if (m.f < d.startup) { phase = 0; k = m.f / d.startup; }
      else if (m.f < d.startup + d.active) { phase = 1; k = (m.f - d.startup) / d.active; }
      else { phase = 2; k = (m.f - d.startup - d.active) / d.recovery; }
      return Poses.strike(this.ch, m.kind, phase, Math.min(1, k));
    }

    draw(ctx, camX) {
      const p = this.pose();
      let tint = null;
      if (this.flashT > 0 && this.flashT % 2) tint = [255, 255, 255, 0.75];
      else if (this.buff > 0) tint = (this.t >> 2) % 2 ? [100, 255, 60, 0.35] : null;
      else if (this.poison > 0) tint = (this.t >> 3) % 2 ? [120, 200, 80, 0.35] : null;
      else if (this.vuln > 0) tint = (this.t >> 3) % 3 === 0 ? [255, 220, 60, 0.35] : null;
      else if (this.rage) tint = [255, 40, 20, 0.16 + Math.abs(Math.sin(this.t / 10)) * 0.12];
      const sx = Math.round(this.x - camX), sy = Math.round(GROUND + this.y);
      const useSheet = window.SheetSprites && SheetSprites.ready(this.ch);
      const sst = useSheet ? this.sheetState() : null;
      if (!useSheet) Sprites.render(this.canvas, this.ch, p, this.anim, tint || (this.alt ? [60, 90, 200, 0.3] : null));
      // sombra
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      const sw = Math.max(14, 44 * (this.ch.scale || 1) / 1.45 + this.y / 4);
      ctx.fillRect(Math.round(sx - sw / 2), GROUND - 1, Math.round(sw), 3);
      // kart
      if (this.move && this.move.def && this.move.def.fx === 'kart' && this.state === 'special' && !(useSheet && SheetSprites.hasProp(this.ch, sst, 'kart'))) {
        if (!(window.FX && FX.draw(ctx, 'kart', sx, sy + 1, { flip: this.facing < 0, ay: 1 }))) { ctx.save(); ctx.translate(sx, sy); ctx.scale(1.5, 1.5); drawKart(ctx, 0, 0, this.facing, this.t); ctx.restore(); }
      }
      if (this.inv > 0 && this.state === 'getup' && (this.t % 4 < 2)) ctx.globalAlpha = 0.7;
      // Belipe Bravo (modo história): usa os quadros com a cara brava enquanto estiver nervoso
      const vch = this.rage && SheetSprites.variant ? SheetSprites.variant(this.ch, 'bravo') : null;
      const dch = vch && SheetSprites.ready2(vch) ? vch : this.ch;
      if (useSheet) SheetSprites.draw(ctx, dch, sst, this.anim, sx, sy, this.facing, 1, dch !== this.ch ? (this.flashT > 0 && this.flashT % 2 ? tint : null) : tint, this.alt);
      else {
        ctx.save();
        ctx.translate(sx, sy);
        if (this.facing === -1) ctx.scale(-1, 1);
        ctx.drawImage(this.canvas, -Sprites.OX, -Sprites.OY);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (p.flash) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(sx + this.facing * 18 - 6, sy - 66, 12, 12); }
      if (p.heart) { for (let i = 0; i < 3; i++) heart(ctx, sx + Math.sin(this.t / 10 + i * 2) * 14, sy - 70 - ((this.t + i * 20) % 60) / 2); }
      if (this.state === 'dizzy') {
        const hy = sy - 62 * (this.ch.scale || 1);
        for (let i = 0; i < 3; i++) {
          const a = this.t / 8 + i * 2.1, px = sx + Math.cos(a) * 12, py = hy + Math.sin(a) * 3;
          ctx.fillStyle = '#ffd400'; ctx.fillRect(Math.round(px) - 1, Math.round(py), 3, 1); ctx.fillRect(Math.round(px), Math.round(py) - 1, 1, 3);
        }
      }
      // textos
      const nt = this.texts.length;
      this.texts.forEach((tx, i) => { // o mais novo fica embaixo; os antigos sobem por cima
        Font.text(ctx, tx.s, sx, sy - 66 * (this.ch.scale || 1) - 8 - tx.t * 0.4 - (nt - 1 - i) * 10, tx.color, { align: 'center', outline: '#000000' });
      });
    }
  }

  function heart(ctx, x, y, col) {
    x = Math.round(x); y = Math.round(y); ctx.fillStyle = col || '#ff5a8a';
    ctx.fillRect(x - 3, y, 3, 2); ctx.fillRect(x + 1, y, 3, 2); ctx.fillRect(x - 3, y + 1, 7, 2); ctx.fillRect(x - 2, y + 3, 5, 1); ctx.fillRect(x - 1, y + 4, 3, 1); ctx.fillRect(x, y + 5, 1, 1);
  }
  function drawKart(ctx, x, y, f, t) {
    ctx.save(); ctx.translate(x, y); if (f === -1) ctx.scale(-1, 1);
    ctx.fillStyle = '#d8201a'; ctx.fillRect(-18, -12, 36, 8); ctx.fillStyle = '#a8140e'; ctx.fillRect(-18, -6, 36, 2);
    ctx.fillStyle = '#ffd400'; ctx.fillRect(10, -12, 8, 3);
    ctx.fillStyle = '#111'; ctx.fillRect(-16, -5, 9, 6); ctx.fillRect(8, -5, 9, 6);
    ctx.fillStyle = '#666'; ctx.fillRect(-13 + (t % 2), -3, 3, 2); ctx.fillRect(11 + (t % 2), -3, 3, 2);
    Font.text(ctx, '10', -6, -11, '#ffffff');
    ctx.restore();
  }

  // ---------- Entidades ----------
  class Projectile {
    constructor(owner, d, i, n, delay) {
      this.owner = owner; this.d = d;
      const s = owner.ch.scale || 1;
      this.x = owner.x + owner.facing * 22 * s; this.y = GROUND - 44 * s + (n > 1 ? (i - (n - 1) / 2) * (d.spread || 10) : 0);
      this.vx = owner.facing * (d.speed || 4) * (n > 1 && d.arc ? 0.8 + i * 0.25 : 1);
      this.vy = d.arc ? -3.2 - i * 0.6 : 0;
      if (d.type === 'volley') this.y = GROUND - 30 - ((delay * 13) % 34);
      this.w = d.w || 12; this.h = d.h || 10; this.life = d.life || 200; this.t = 0;
      this.hitsLeft = d.hits || 1; this.dead = false; this.kind = 'proj'; this.item = i;
    }
    update(game) {
      this.t++; this.x += this.vx; this.y += this.vy;
      if (this.d.arc) { this.vy += 0.18; if (this.y > GROUND - 6) this.dead = true; }
      if (--this.life <= 0 || this.x < -30 || this.x > Stages.WIDTH + 30) this.dead = true;
      const opp = game.other(this.owner);
      const box = { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
      if (!this.dead && overlap(box, opp.hurtbox())) {
        const hb = { dmg: this.d.dmg, stun: 18 + (this.d.stun || 0), level: 'mid', push: 2, special: true, poison: this.d.poison, vuln: this.d.type === 'debuff' ? this.d.dur : 0 };
        const r = opp.takeHit(game, this.owner, hb, this);
        if (r === 'counter') return;
        if (r !== 'miss') { this.dead = true; game.particle(this.x, this.y, 'pop'); }
      }
    }
    draw(ctx, camX) {
      const x = Math.round(this.x - camX), y = Math.round(this.y), f = Math.sign(this.vx) || 1, t = this.t;
      const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
      if (this.drawSprite(ctx, x, y, f, t, R)) return;
      switch (this.d.fx) {
        case 'duckfoot': // pé de pato frito
          R(-6, -3, 10, 6, '#c8862a'); R(-8, -5, 3, 3, '#c8862a'); R(-8, 1, 3, 3, '#c8862a'); R(-9, -2, 3, 3, '#c8862a'); R(4, -1, 5, 2, '#a86a1a'); R(-4, -2, 6, 1, '#e8a84a');
          if (t % 6 < 3) R(-14 * f, -1, 4, 1, '#ffffff');
          break;
        case 'dadinho': R(-3, -3, 7, 7, '#f2d27a'); R(-3, -3, 7, 1, '#fff2b0'); R(2, 2, 2, 2, '#d8a84a'); break;
        case 'poll': {
          R(-8, -7, 16, 14, '#ffffff'); R(-8, -7, 16, 3, '#25d366');
          R(-6, -2, 3, 3, '#25d366'); R(-2, -2, 7, 1, '#888'); R(-6, 3, 3, 1, '#888'); R(-2, 3, 7, 1, '#888');
          R(-5, -1, 1, 1, '#ffffff');
          break;
        }
        case 'bubble': R(-11, -7, 22, 13, '#ffffff'); R(-9 * f, 6, 4, 3, '#ffffff'); Font.text(ctx, this.d.text, x, y - 3, '#c0281c', { align: 'center' }); break;
        case 'text': Font.text(ctx, this.d.text, x, y - 4, (t >> 2) % 2 ? '#ffd400' : '#ffffff', { align: 'center', scale: 2, outline: '#000' }); break;
        case 'items': {
          const it = this.item % 3;
          if (it === 0) { R(-3, -3, 7, 6, '#f2c060'); R(-2, -2, 2, 2, '#fff0b0'); } // pão de queijo
          else if (it === 1) { R(-2, -5, 5, 10, '#c0281c'); R(-2, -2, 5, 2, '#ffffff'); } // lata de refri
          else { R(-4, -3, 8, 6, '#3a3a3a'); R(-3, -2, 2, 1, '#666'); } // carvão
          break;
        }
        case 'lightstick': R(-1, -1, 10 * -f, 2, '#ccc'); R(-4, -5, 8, 8, (t >> 2) % 2 ? '#c38cff' : '#fff'); R(-2, -3, 4, 4, '#ffffff');
          for (let i = 1; i < 4; i++) R(-f * i * 6, -1, 2, 2, '#c38cff');
          break;
        case 'wave': {
          const r = 4 + (t % 10) / 2;
          for (let i = 0; i < 3; i++) { R(-f * i * 5 - 2, -r + i, 2, r * 2 - i * 2, i === 0 ? '#ffffff' : '#9fdcff'); }
          Font.text(ctx, this.d.text, x, y - 16, '#ffffff', { align: 'center', outline: '#2a4a8a' });
          break;
        }
        case 'zombie': R(-5, -5, 10, 10, '#5a8a3a'); R(-3, -3, 2, 2, '#ff2a2a'); R(1, -3, 2, 2, '#ff2a2a'); R(-3, 2, 6, 1, '#2a3a1a');
          if (t % 8 < 4) R(-f * 9, 0, 3, 3, '#88ff66');
          break;
        case 'cookie': R(-5, -5, 10, 10, '#b8763a'); R(-5, -5, 10, 2, '#d8964a'); R(-3, -2, 2, 2, '#3a1a0a'); R(1, 0, 2, 2, '#3a1a0a'); R(-1, 2, 2, 1, '#3a1a0a'); break;
        case 'clipboard': Sprites.drawProp(ctx, 'clipboard', x, y + 4, t); R(-8, -10, 2, 2, '#ffd400'); break;
        default: R(-5, -5, 10, 10, '#ffffff');
      }
      if (this.reflected) R(-1, -10, 2, 2, '#ffd400');
    }
    // versão com os sprites de efeitos (assets/fx); devolve false se não houver sprite
    fxName() {
      const fxn = this.d.fx;
      return fxn === 'dadinho' ? 'cube' + (this.item % 3) : ({ duckfoot: 1, poll: 1, bubble: 1, lightstick: 1, zombie: 1, cookie: 1, clipboard: 1, wave: 1 }[fxn] ? fxn : null);
    }
    spriteReady() { const n = this.fxName(); return !!n && !!window.FX && FX.ready(n); }
    // desenhado 1:1 (sem a ampliação de 1.4 dos efeitos desenhados à mão)
    drawSprite(ctx, x, y, f, t, R) {
      const fxn = this.d.fx, name = this.fxName();
      if (!this.spriteReady()) return false;
      const o = { flip: f < 0 && fxn !== 'poll' && fxn !== 'clipboard' };
      if (fxn === 'cookie' || fxn === 'lightstick') o.rot = t * 0.4 * f;
      if (fxn === 'duckfoot' || fxn === 'dadinho') o.rot = t * 0.22 * f;
      if (fxn === 'zombie' || fxn === 'poll') y += Math.round(Math.sin(t / 4) * 1.5);
      if (fxn === 'lightstick') for (let i = 1; i < 4; i++) R(-f * i * 8 - 1, -1, 3, 3, (t >> 2) % 2 ? '#c38cff' : '#ffffff');
      if (fxn === 'zombie' && t % 8 < 4) R(-f * 13 - 2, 0, 4, 4, '#88ff66');
      if (fxn === 'duckfoot' && t % 6 < 3) R(-20 * f - 3, -1, 6, 1, '#ffffff');
      if (fxn === 'wave') FX.draw(ctx, name, x, y, { flip: o.flip, sy: 1.3 + Math.sin(t / 2) * 0.25 });
      else FX.draw(ctx, name, x, y, o);
      if (fxn === 'bubble') Font.text(ctx, this.d.text, x, y - 5, '#c0281c', { align: 'center' });
      if (fxn === 'wave') Font.text(ctx, this.d.text, x, y - 22, '#ffffff', { align: 'center', outline: '#2a4a8a' });
      if (fxn === 'clipboard') R(-11, -14, 3, 3, '#ffd400');
      if (this.reflected) R(-1, -17, 3, 3, '#ffd400');
      return true;
    }
  }

  class RainDrop { // pipoca caindo do céu
    constructor(owner, opp, d, i) {
      this.owner = owner; this.d = d; this.kind = 'proj';
      this.x = opp.x + (Math.random() - 0.5) * 70; this.y = -10 - i * 4; this.vy = 3.5; this.t = 0; this.dead = false; this.big = i % 3 === 0;
    }
    update(game) {
      this.t++; this.y += this.vy; this.vy += 0.1;
      if (this.y > GROUND - 2) { this.dead = true; game.particle(this.x, GROUND - 4, 'pop'); }
      const opp = game.other(this.owner);
      if (!this.dead && overlap({ x: this.x - 6, y: this.y - 6, w: 12, h: 12 }, opp.hurtbox())) {
        const r = opp.takeHit(game, this.owner, { dmg: this.d.dmg, stun: 22, level: 'high', special: true, push: 0.5 }, this);
        if (r !== 'miss') { this.dead = true; game.particle(this.x, this.y, 'pop'); }
      }
    }
    spriteReady() { return !!window.FX && FX.ready('popcorn'); }
    draw(ctx, camX) {
      const x = Math.round(this.x - camX), y = Math.round(this.y);
      if (this.spriteReady()) { // 1:1
        ctx.fillStyle = '#fff6d0'; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 6, y - 1, 4, 4); ctx.fillRect(x + 1, y - 6, 4, 4);
        ctx.fillStyle = '#f2c040'; ctx.fillRect(x, y + 1, 3, 3);
        if (this.big) FX.draw(ctx, 'popcorn', x, y - 14, {});
        return;
      }
      ctx.fillStyle = '#fff6d0'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 1, 3, 3); ctx.fillRect(x + 1, y - 4, 3, 3);
      ctx.fillStyle = '#f2c040'; ctx.fillRect(x, y + 1, 2, 2);
      if (this.big) Sprites.drawProp(ctx, 'popcorn', x, y - 10, this.t);
    }
  }

  class Summon {
    constructor(owner, d, i) {
      this.owner = owner; this.d = d; this.i = i; this.kind = 'summon';
      this.f = owner.facing;
      this.x = owner.x - this.f * (30 + i * 18); this.y = GROUND;
      this.vx = this.f * (d.speed + (d.entity === 'crowd' ? (i % 3) * 0.6 : 0) + (d.entity === 'cats' ? i * 0.5 : 0));
      this.t = 0; this.dead = false; this.hitsLeft = d.entity === 'crowd' ? 1 : d.hits / (d.entity === 'cats' ? 2 : 1); this.cd = 0;
    }
    update(game) {
      this.t++; this.x += this.vx; if (this.cd > 0) this.cd--;
      if (this.x < -60 || this.x > Stages.WIDTH + 60) this.dead = true;
      if (this.d.entity === 'dog' && this.t % 20 === 0) Sound.play('bark');
      const opp = game.other(this.owner);
      const box = { x: this.x - 10, y: GROUND - (this.d.entity === 'crowd' ? 40 : 18) - (this.d.entity === 'cats' ? Math.abs(Math.sin(this.t / 6)) * 20 : 0), w: 20, h: this.d.entity === 'crowd' ? 40 : 18 };
      if (this.hitsLeft > 0 && this.cd === 0 && overlap(box, opp.hurtbox())) {
        const r = opp.takeHit(game, this.owner, { dmg: this.d.dmg, stun: 22, level: 'low', special: true, push: 1.5, knockdown: this.d.super && this.hitsLeft === 1 }, this);
        if (r !== 'miss') { this.hitsLeft--; this.cd = 10; }
      }
    }
    draw(ctx, camX) {
      const x = Math.round(this.x - camX), y = GROUND, t = this.t;
      if (this.drawSprite(ctx, x, y, t)) return;
      ctx.save(); ctx.translate(x, y); if (this.f === -1) ctx.scale(-1, 1);
      const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
      if (this.d.entity === 'dog') { // Amora: beagle branca, preta e caramelo, com bandeira do Brasil
        const l = (t >> 2) % 2;
        R(-12, -14, 20, 8, '#f4f0ea'); R(-8, -14, 10, 5, '#2a2220'); R(6, -18, 9, 8, '#f4f0ea'); R(7, -20, 6, 4, '#a8682a');
        R(4, -18, 3, 7, '#a8682a'); R(14, -14, 3, 2, '#1a1a1a'); R(11, -17, 1, 1, '#1a1a1a'); R(-15, -16, 4, 2, '#a8682a');
        R(-10 + l * 2, -6, 3, 6, '#f4f0ea'); R(-4 - l * 2, -6, 3, 6, '#f4f0ea'); R(2 + l * 2, -6, 3, 6, '#f4f0ea'); R(6 - l * 2, -6, 3, 6, '#f4f0ea');
        R(-2, -14, 6, 3, '#0a9a3a'); R(0, -14, 2, 2, '#ffd400');
        if ((t >> 3) % 2) Font.text(ctx, 'AU!', 8, -30, '#ffffff', { outline: '#000' });
      } else if (this.d.entity === 'cats') { // duas gatas idênticas
        const j = -Math.abs(Math.sin(t / 6)) * 20;
        R(-8, -10 + j, 14, 7, '#4a4a52'); R(4, -15 + j, 8, 7, '#4a4a52'); R(4, -17 + j, 2, 2, '#4a4a52'); R(10, -17 + j, 2, 2, '#4a4a52');
        R(7, -13 + j, 1, 1, '#a0ff60'); R(10, -13 + j, 1, 1, '#a0ff60'); R(-12, -14 + j, 4, 2, '#4a4a52'); R(-6, -3 + j, 2, 3, '#4a4a52'); R(2, -3 + j, 2, 3, '#4a4a52');
        if (t % 30 < 15) Font.text(ctx, 'MIAU', 0, -28 + j, '#ffffff', { outline: '#000' });
      } else if (this.d.entity === 'crowd') { // Fiel Torcida
        const b = Math.abs(Math.sin(t / 4 + this.i)) * 3;
        R(-4, -34 - b, 8, 8, '#d9a27a'); R(-5, -35 - b, 10, 3, '#1a1a1a');
        R(-5, -26 - b, 10, 14, this.i % 2 ? '#111111' : '#f2f2f2'); R(-5, -22 - b, 10, 2, this.i % 2 ? '#f2f2f2' : '#111111');
        R(-4, -12, 3, 12, '#222'); R(1, -12, 3, 12, '#222');
        if (this.i % 3 === 0) { R(4, -50 - b, 1, 20, '#888'); R(5, -50 - b, 14, 9, '#111'); R(7, -48 - b, 10, 2, '#fff'); }
      }
      ctx.restore();
    }
    spriteReady() { const e = this.d.entity; return !!window.FX && FX.ready(e === 'dog' ? 'dog0' : e === 'cats' ? 'cat0' : 'fan0'); }
    drawSprite(ctx, x, y, t) { // 1:1
      if (!this.spriteReady()) return false;
      const e = this.d.entity;
      let name, o = { flip: this.f < 0, ay: 1 }, yy = y, label = null, ly = 0;
      if (e === 'dog') { name = 'dog' + ((t >> 2) % 4); if ((t >> 3) % 2) { label = 'AU!'; ly = -36; } }
      else if (e === 'cats') { name = 'cat' + ((t >> 3) % 2); yy = y - Math.round(Math.abs(Math.sin(t / 6)) * 28); if (t % 30 < 15) { label = 'MIAU'; ly = -34; } }
      else { name = 'fan' + (((t >> 3) + this.i) % 2); yy = y - Math.round(Math.abs(Math.sin(t / 4 + this.i)) * 4); }
      FX.draw(ctx, name, x, yy, o);
      if (label) Font.text(ctx, label, x + this.f * 11, yy + ly, '#ffffff', { align: 'center', outline: '#000' });
      return true;
    }
  }

  class Trap { // Catraca de Academia: catraca que dá choque em quem passa
    spriteReady() { return !!window.FX && FX.ready('gate'); }
    constructor(owner, d) {
      this.owner = owner; this.d = d; this.kind = 'trap';
      this.x = Math.max(20, Math.min(Stages.WIDTH - 20, owner.x + owner.facing * d.dist)); this.t = 0; this.dead = false; this.fired = 0;
    }
    update(game) {
      this.t++;
      if (this.t > this.d.life) this.dead = true;
      if (this.fired) { if (++this.fired > 30) this.dead = true; return; }
      const opp = game.other(this.owner);
      if (overlap({ x: this.x - 12, y: GROUND - 60, w: 24, h: 60 }, opp.hurtbox())) {
        this.fired = 1;
        opp.say('ROSTO NAO RECONHECIDO', '#ff4a4a');
        opp.takeHit(game, this.owner, { dmg: this.d.dmg, stun: 20 + this.d.stun, level: 'mid', special: true, unblockable: true, push: 1 }, this);
        Sound.play('block');
      }
    }
    draw(ctx, camX) {
      const x = Math.round(this.x - camX), y = GROUND, t = this.t;
      const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
      if (this.spriteReady()) { // 1:1
        FX.draw(ctx, 'gate', x, y, { ay: 1 });
        R(-3, -53, 5, 4, this.fired ? '#ff3030' : ((t >> 3) % 2 ? '#3aff7a' : '#1a8a3a'));
        if (!this.fired) { const sy = -28 + Math.sin(t / 6) * 17; ctx.fillStyle = 'rgba(80,255,140,0.35)'; ctx.fillRect(x - 17, y + sy, 34, 2); }
        else { ctx.fillStyle = 'rgba(255,60,60,0.35)'; ctx.fillRect(x - 21, y - 48, 42, 48); }
        return;
      }
      R(-14, -64, 4, 64, '#7a8088'); R(10, -64, 4, 64, '#7a8088'); R(-14, -64, 28, 4, '#7a8088');
      R(-6, -58, 12, 10, '#222'); R(-5, -57, 10, 8, this.fired ? '#ff3030' : ((t >> 3) % 2 ? '#3aff7a' : '#1a8a3a'));
      if (!this.fired) { const sy = -40 + Math.sin(t / 6) * 18; ctx.fillStyle = 'rgba(80,255,140,0.35)'; ctx.fillRect(x - 10, y + sy, 20, 2); }
      else { ctx.fillStyle = 'rgba(255,60,60,0.4)'; ctx.fillRect(x - 10, y - 60, 20, 60); }
    }
  }

  class Beam {
    constructor(owner, d) {
      this.owner = owner; this.d = d; this.kind = 'beam'; this.t = 0; this.dead = false; this.hits = 0;
      this.every = Math.floor(d.dur / d.hits);
      if (d.text) owner.say(d.text, d.color);
    }
    update(game) {
      this.t++;
      if (this.t > this.d.dur || this.owner.state !== 'special') { this.dead = true; return; }
      const o = this.owner, s = o.ch.scale || 1;
      this.y = GROUND + o.y - 40 * s;
      this.x0 = o.x + o.facing * 24; this.x = this.x0;
      const len = Math.min(320, this.t * 18);
      const box = o.facing === 1 ? { x: this.x0, y: this.y - 12, w: len, h: 24 } : { x: this.x0 - len, y: this.y - 12, w: len, h: 24 };
      const opp = game.other(o);
      if (this.t % this.every === 0 && this.hits < this.d.hits && overlap(box, opp.hurtbox())) {
        this.hits++;
        opp.takeHit(game, o, { dmg: this.d.dmg, stun: 22, level: 'mid', special: true, push: 0.6, knockdown: this.hits === this.d.hits }, null);
      }
      this.len = len;
    }
    draw(ctx, camX) {
      if (!this.len) return;
      const f = this.owner.facing, x0 = Math.round(this.x0 - camX), y = Math.round(this.y), t = this.t;
      const w = 10 + Math.sin(t) * 2;
      const col = this.d.color;
      const spr = { army: 'beamPurple', vote: 'beamGold', rice: 'beamWhite' }[this.d.fx];
      if (spr && window.FX && FX.beam(ctx, spr, x0, y, this.len, f, t, 1)) { this.drawBits(ctx, x0, y, f, t, 9); this.drawRice(ctx, x0, y, f, t); return; }
      ctx.fillStyle = col; ctx.globalAlpha = 0.5;
      ctx.fillRect(f === 1 ? x0 : x0 - this.len, y - w - 3, this.len, (w + 3) * 2);
      ctx.globalAlpha = 1;
      ctx.fillRect(f === 1 ? x0 : x0 - this.len, y - w, this.len, w * 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(f === 1 ? x0 : x0 - this.len, y - w / 3, this.len, w / 1.5);
      this.drawBits(ctx, x0, y, f, t, w);
      this.drawRice(ctx, x0, y, f, t);
    }
    drawRice(ctx, x0, y, f, t) { // panela de arroz na origem (se o quadro do personagem ainda não mostra)
      const o = this.owner;
      if (this.d.fx !== 'rice' || (window.SheetSprites && SheetSprites.hasProp(o.ch, o.sheetState(), 'ricecooker'))) return;
      if (!(window.FX && FX.draw(ctx, 'ricecooker', x0 + f * 2, y + 2, { flip: f < 0 }))) Sprites.drawProp(ctx, 'ricecooker', x0 + f * 2, y + 6, t);
    }
    drawBits(ctx, x0, y, f, t, w) {
      for (let i = 0; i < this.len; i += 14) {
        const xx = x0 + f * ((i + t * 6) % this.len);
        if (this.d.fx === 'rice') { ctx.fillStyle = '#f2f2e0'; ctx.fillRect(xx, y - w - 4 + (i % 3) * 8, 3, 2); }
        if (this.d.fx === 'army') { heart(ctx, xx, y - w - 8 + (i % 4) * 7, '#7a3ad8'); }
        if (this.d.fx === 'vote') { ctx.fillStyle = '#0a7a3a'; ctx.fillRect(xx, y - w - 6 + (i % 3) * 9, 5, 4); ctx.fillStyle = '#fff'; ctx.fillRect(xx + 1, y - w - 5 + (i % 3) * 9, 3, 1); }
      }
    }
  }

  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  window.FighterLib = { Fighter, HumanCtrl, overlap, MAX_HP, GROUND, heart };
})();
