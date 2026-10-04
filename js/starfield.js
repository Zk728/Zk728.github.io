/* =========================================================
   hexo-theme-galaxy — 星空 + 流星 Canvas 效果
   通过 window.GALAXY_CONFIG 读取主题配置（见 scripts.ejs 注入）
   ========================================================= */
(function () {
  'use strict';

  var cfg = window.GALAXY_CONFIG || {};

  var canvas = document.getElementById('starfield');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var stars = [];
  var meteors = [];
  var running = true;

  var OPTIONS = {
    starCount: cfg.starCount || 220,
    maxRadius: cfg.maxRadius || 1.8,
    twinkleSpeed: cfg.twinkleSpeed || 0.035,
    driftSpeed: cfg.driftSpeed || 0.06,
    meteorCount: cfg.meteorCount || 2,
    meteorInterval: cfg.meteorInterval || 2600,
    meteorSpeed: cfg.meteorSpeed || 9,
    primary: cfg.primaryColor || '#00e5ff',
    secondary: cfg.secondaryColor || '#a855f7'
  };

  /* ---------- 尺寸自适应 ---------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ---------- 星星 ---------- */
  function Star() {
    this.reset(true);
  }
  Star.prototype.reset = function (init) {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = 0.3 + Math.random() * OPTIONS.maxRadius;
    this.baseAlpha = 0.25 + Math.random() * 0.65;
    this.twinkle = 0.008 + Math.random() * OPTIONS.twinkleSpeed;
    this.phase = Math.random() * Math.PI * 2;
    this.driftX = (Math.random() - 0.5) * OPTIONS.driftSpeed;
    this.driftY = (Math.random() - 0.5) * OPTIONS.driftSpeed;
    this.hue = Math.random() < 0.82 ? OPTIONS.primary : OPTIONS.secondary;
    this.init = !!init;
  };
  Star.prototype.draw = function (t) {
    this.phase += this.twinkle;
    var alpha = this.baseAlpha * (0.6 + 0.4 * Math.sin(this.phase));

    // 缓慢漂移，出界后重置
    this.x += this.driftX;
    this.y += this.driftY;
    if (this.x < -2) this.x = W + 2;
    if (this.x > W + 2) this.x = -2;
    if (this.y < -2) this.y = H + 2;
    if (this.y > H + 2) this.y = -2;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.hue;
    ctx.globalAlpha = Math.max(0.05, alpha);
    // 较大星星带光晕
    if (this.r > 1.1) {
      ctx.shadowColor = this.hue;
      ctx.shadowBlur = 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    void t;
  };

  /* ---------- 流星 ---------- */
  function Meteor() {
    this.active = false;
    this.reset();
  }
  Meteor.prototype.reset = function () {
    // 从上方随机位置斜向划过
    this.x = Math.random() * W * 0.9;
    this.y = -20 - Math.random() * H * 0.35;
    var angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35; // 45° 左右斜向
    var speed = OPTIONS.meteorSpeed * (0.7 + Math.random() * 0.6);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.fade = 0.006 + Math.random() * 0.008;
    this.length = 60 + Math.random() * 90;
    this.active = true;
  };
  Meteor.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.fade;
    if (this.life <= 0 || this.x > W + 200 || this.y > H + 200) {
      this.active = false;
    }
  };
  Meteor.prototype.draw = function () {
    if (!this.active) return;
    var tailX = this.x - this.vx * 8;
    var tailY = this.y - this.vy * 8;
    var grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    grad.addColorStop(0, 'rgba(255,255,255,' + (0.95 * this.life) + ')');
    grad.addColorStop(0.25, 'rgba(' + hexToRgb(OPTIONS.primary) + ',' + (0.55 * this.life) + ')');
    grad.addColorStop(1, 'rgba(' + hexToRgb(OPTIONS.primary) + ',0)');

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.shadowColor = OPTIONS.primary;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 流星头部亮点
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * this.life) + ')';
    ctx.fill();
  };

  function hexToRgb(hex) {
    var m = hex.replace('#', '');
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var n = parseInt(m, 16);
    return (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255);
  }

  /* ---------- 主循环 ---------- */
  var lastMeteorTime = 0;

  function initStars() {
    stars = [];
    for (var i = 0; i < OPTIONS.starCount; i++) stars.push(new Star());
  }

  function ensureMeteors(t) {
    var active = meteors.filter(function (m) { return m.active; }).length;
    if (active >= OPTIONS.meteorCount) return;
    if (t - lastMeteorTime < OPTIONS.meteorInterval) return;
    lastMeteorTime = t;
    var slot = meteors.find(function (m) { return !m.active; });
    if (slot) slot.reset();
    else meteors.push(new Meteor());
  }

  function frame(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) stars[i].draw(t);
    ensureMeteors(t);
    for (var j = 0; j < meteors.length; j++) {
      meteors[j].update();
      meteors[j].draw();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 启动 ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resize();
  initStars();
  if (reduceMotion) {
    // 减少动效：只绘制静态星空，不循环
    for (var i = 0; i < stars.length; i++) stars[i].draw(0);
  } else {
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', function () {
    resize();
    initStars();
  });

  // 页面隐藏时暂停，减少资源占用
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false;
    else { running = true; requestAnimationFrame(frame); }
  });
})();
