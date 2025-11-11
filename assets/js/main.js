// Carrossel infinito sem dependências (clona itens e anima via RAF)
(function(){
  const root = document.querySelector('[data-carousel]');
  if(!root) return;
  const track = root.querySelector('.carousel-track');
  // Usando a velocidade do main.js/main2.js
  const speed = 0.6; // pixels por frame
  let x = 0, paused = false;

  // Clonar itens para continuidade infinita
  // Adiciona duas vezes para garantir que há cópias suficientes para um loop suave
  const items = Array.from(track.children);
  items.forEach(el => track.appendChild(el.cloneNode(true)));
  items.forEach(el => track.appendChild(el.cloneNode(true))); 

  function step(){
    if (!paused){
      x -= speed;
      const first = track.children[0];
      // Adiciona o 'gap' de 16px conforme definido no CSS (carousel-track)
      const cardW = first.getBoundingClientRect().width + 16; 
      if (Math.abs(x) >= cardW){
        // Move o primeiro item para o final quando ele sai da vista
        track.appendChild(track.children[0]); 
        // Reposiciona o 'x' para manter a ilusão de loop suave
        x += cardW;                           
      }
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(step);
  }
  
  // Pausa ao passar o mouse para melhor UX
  root.addEventListener('mouseenter', () => paused = true);
  root.addEventListener('mouseleave', () => paused = false);
  
  // Inicia a animação
  step();
})();


// Comportamento das abas de Planos (Pricing tabs behavior)
(function initPricingTabs(){
  const tabs = document.querySelectorAll('.pricing-tab');
  // Verifica se existem abas para inicializar
  if(!tabs.length) return;
  
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      // Remove 'active' de todas as abas e desmarca a seleção ARIA
      document.querySelectorAll('.pricing-tab').forEach(b=>b.classList.remove('active'));
      tabs.forEach(b=>b.setAttribute('aria-selected','false'));
      
      // Ativa a aba clicada e marca a seleção ARIA
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      
      // Pega o ID do painel de conteúdo a ser exibido
      const target = btn.getAttribute('data-target');
      
      // Esconde todos os painéis de preço
      document.querySelectorAll('#planos .pricing').forEach(p=>p.classList.add('hidden'));
      
      // Exibe o painel de preço correspondente ao target
      const panel = document.getElementById(target);
      if (panel) panel.classList.remove('hidden');
    });
  });
})();