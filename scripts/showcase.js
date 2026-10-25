/* Presentation-only native HTML views. User input stays on the website. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const kind = document.body.dataset.showcase;
  const content = $('showcase-content');
  const parentOrigin = new URL(location.href).origin;
  const scenes = ['discover','review','build','deliver'];
  let currentScene = 'discover';
  function activeRail(id) {
    document.querySelectorAll('[data-rail]').forEach(button => {
      if (button.dataset.rail === id) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
  }
  function showScene(id) {
    if (kind !== 'workflow' || !scenes.includes(id) || id === currentScene) return;
    currentScene = id;
    content.replaceChildren($('scene-'+id).content.cloneNode(true));
    content.scrollTop = 0;
    content.classList.remove('showcase-enter');
    requestAnimationFrame(() => {
      content.classList.add('showcase-enter');
      if (id === 'build') {
        const output=content.querySelector('.exec-console-output');
        output.scrollTop=output.scrollHeight;
      }
    });
    activeRail(id === 'discover' ? 'review' : id);
  }
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== parentOrigin || event.data?.channel !== 'selfme-showcase') return;
    if (['mac','windows'].includes(event.data.platform)) document.documentElement.dataset.platform = event.data.platform;
    if (event.data.scene) showScene(event.data.scene);
  });
  activeRail(kind === 'project' ? 'project' : 'review');
  if (kind === 'project') {
    const viewport=$('map-viewport'),world=viewport.querySelector('.project-map-world');
    function fit() {
      if (!viewport.clientWidth || !viewport.clientHeight) return;
      const width=viewport.clientWidth,height=viewport.clientHeight;
      const scale=Math.max(.2,Math.min(1.08,(width-48)/934,(height-36)/438));
      const x=(width-934*scale)/2,y=(height-438*scale)/2;
      world.style.transform=`translate(${x}px, ${y}px) scale(${scale})`;
      $('map-percent').textContent=Math.round(scale*100)+'%';
    }
    new ResizeObserver(fit).observe(viewport);
    requestAnimationFrame(fit);
  }
  parent.postMessage({channel:'selfme-showcase',kind,action:'ready'},'*');
})();
