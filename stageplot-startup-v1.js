// Runs before the application markup and optional external runtime scripts.
// A failed startup leaves a usable retry action and never changes saved projects.
(function(){
  const panel=document.getElementById('sp-startup');
  let complete=false;
  try{
    const theme=JSON.parse(window.localStorage.getItem('stageplot-studio:theme:v1')||'null')?.theme;
    if(theme==='light'||theme==='dark')panel.dataset.theme=theme;
  }catch(error){}
  function failed(event){
    if(complete||!(event.target?.tagName==='SCRIPT'||typeof event.message==='string'))return;
    document.getElementById('sp-startup-message').textContent='Die App konnte nicht vollständig geladen werden.';
    document.getElementById('sp-startup-retry').hidden=false;
    panel.setAttribute('role','alert');
  }
  window.addEventListener('error',failed,true);
  document.getElementById('sp-startup-retry').addEventListener('click',()=>window.location.reload());
  window.StageplotStartup={ready(){
    complete=true;
    window.removeEventListener('error',failed,true);
    const root=document.getElementById('sp-prototype');
    root.removeAttribute('data-booting');root.removeAttribute('aria-busy');root.inert=false;
    panel.hidden=true;
  }};
})();
