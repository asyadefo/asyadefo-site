/* Взаимодействие с карточками архива и модальным окном */
(() => {
  // Если картинка ещё не добавлена, оставляем аккуратную заглушку вместо broken-image.
  document.querySelectorAll('.project-card__media img, .archive-card__media img').forEach(img => {
    const hideMissing = () => { img.style.display = 'none'; };
    img.addEventListener('error', hideMissing, { once: true });
    if (img.complete && img.naturalWidth === 0) hideMissing();
  });
  document.querySelectorAll('.marquee img').forEach(img => {
    const hideMissing = () => { img.style.display = 'none'; };
    img.addEventListener('error', hideMissing, { once: true });
    if (img.complete && img.naturalWidth === 0) hideMissing();
  });

  // Видео архива автоматически запускаются без звука и зацикливаются.
  document.querySelectorAll('.archive-card__media video').forEach(video => {
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    const play = () => video.play().catch(() => {});
    video.addEventListener('canplay', play, { once: true });
    play();
  });

  const modal = document.querySelector('#project-modal');
  if (!modal) return;
  const visual = document.querySelector('#modal-visual');
  const title = document.querySelector('#modal-title');
  const description = document.querySelector('#modal-description');
  const closeButton = modal.querySelector('.project-modal__close');
  let previousFocus = null;

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    visual.querySelectorAll('video').forEach(video => video.pause());
    visual.replaceChildren();
    document.body.style.overflow = '';
    if (previousFocus) previousFocus.focus();
  }

  document.querySelectorAll('.archive-card').forEach(card => {
    card.addEventListener('click', () => {
      previousFocus = card;
      title.textContent = card.dataset.title || '';
      description.textContent = card.dataset.description || '';
      visual.replaceChildren();

      const isVideo = Boolean(card.dataset.video);
      const media = document.createElement(isVideo ? 'video' : 'img');
      media.src = isVideo ? card.dataset.video : card.dataset.image;
      if (isVideo) {
        media.autoplay = true;
        media.loop = true;
        media.muted = true;
        media.playsInline = true;
        media.controls = true;
      } else {
        media.alt = card.dataset.title || '';
        media.addEventListener('error', () => {
          media.style.display = 'none';
          visual.dataset.placeholder = card.dataset.title || 'Изображение проекта';
          visual.classList.add('is-placeholder');
        }, { once: true });
      }
      visual.classList.remove('is-placeholder');
      visual.appendChild(media);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
      if (isVideo) media.play().catch(() => {});
    });
  });

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
