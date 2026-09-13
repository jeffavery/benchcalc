(function(){
  let theme='system';
  try {theme=localStorage.getItem('benchcalc.theme')||'system';} catch(_) {}
  if(!['light','dark','system'].includes(theme)) theme='system';
  document.documentElement.dataset.theme=theme;
})();
