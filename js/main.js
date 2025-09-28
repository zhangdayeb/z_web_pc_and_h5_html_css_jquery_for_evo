// eslint-disable-next-line
const swiper_main = new Swiper('.swiper_main', {
  // pass EffectCarousel module to modules
  modules: [EffectCarousel],
  // specify "carousel" effect
  effect: 'carousel',
  // carousel effect parameters
  carouselEffect: {
    // opacity change per side slide
    opacityStep: 0.33,
    // scale change per side slide
    scaleStep: 0.2,
    // amount of side slides visible, can be 1, 2 or 3
    sideSlides: 2,
  },
  grabCursor: true,
  loop: true,
  loopAdditionalSlides: 1,
  slidesPerView: 'auto',
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    type: 'progressbar',
  },	

  autoplay: {
    delay: 3000,
  },
});


const swiper_hot = new Swiper(".swiper_top", {
  slidesPerView: 1,
  grid: {
	rows: 1,
  },
  spaceBetween: 10,
  pagination: {
	el: ".swiper-pagination",
	clickable: true,
  },
});
