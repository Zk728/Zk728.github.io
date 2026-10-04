/* =========================================================
   hexo-theme-galaxy — 交互脚本：移动端菜单 / 返回顶部 / 打字机
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 移动端菜单 ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  /* ---------- 返回顶部 ---------- */
  var backTop = document.getElementById('back-top');
  if (backTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 320) backTop.classList.add('show');
      else backTop.classList.remove('show');
    }, { passive: true });
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 打字机页头标题 ---------- */
  var typing = document.querySelector('[data-typing]');
  if (typing) {
    var text = typing.getAttribute('data-typing');
    var cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    typing.textContent = '';
    typing.appendChild(cursor);

    var i = 0;
    var speed = 110; // 毫秒/字
    var timer = setInterval(function () {
      if (i < text.length) {
        cursor.insertAdjacentText('beforebegin', text[i]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  }
})();
