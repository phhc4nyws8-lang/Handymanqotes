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

  // Email quote modal
  var modal = document.getElementById('quote-modal');
  if (modal && typeof modal.showModal === 'function') {
    var openers = document.querySelectorAll('[data-open-modal="quote-modal"]');
    var lastOpener = null;

    openers.forEach(function (opener) {
      opener.addEventListener('click', function (e) {
        e.preventDefault();
        lastOpener = opener;
        modal.showModal();
        document.getElementById('quote-name').focus();
      });
    });

    modal.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.close(); });
    });

    // Click on the backdrop (the dialog element itself, outside its content) closes it
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.close();
    });

    modal.addEventListener('close', function () {
      if (lastOpener) lastOpener.focus();
    });

    var form = document.getElementById('quote-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var message = form.message.value.trim();

      var subject = 'Handyman Quote Request' + (name ? ' from ' + name : '');
      var bodyLines = [message, ''];
      if (phone) bodyLines.push('Phone: ' + phone);
      bodyLines.push('Name: ' + name);

      var mailto = 'mailto:james@jchandyman.work'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(bodyLines.join('\n'));

      window.location.href = mailto;
      modal.close();
      form.reset();
    });
  }
  // If <dialog> isn't supported, the buttons fall back to their plain
  // mailto: href (no JS interception happens above).
})();
