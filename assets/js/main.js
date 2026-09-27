(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Before/after comparison sliders
  var sliders = document.querySelectorAll('[data-ba-slider]');

  sliders.forEach(function (slider) {
    var beforeWrap = slider.querySelector('.ba-before-wrap');
    var beforeImg = slider.querySelector('.ba-before');
    var range = slider.querySelector('.ba-range');
    var handle = slider.querySelector('.ba-handle');

    function syncImageWidth() {
      var fullWidth = slider.offsetWidth;
      beforeImg.style.width = fullWidth + 'px';
    }

    function update(value) {
      beforeWrap.style.width = value + '%';
      handle.style.left = value + '%';
    }

    syncImageWidth();
    update(range.value);

    range.addEventListener('input', function (e) {
      update(e.target.value);
    });

    window.addEventListener('resize', syncImageWidth);
  });
})();
