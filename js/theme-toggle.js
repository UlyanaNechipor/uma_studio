/* UMA · theme-toggle
   Перенесено из блока Тильды rec4287670601. */

if (localStorage.getItem('theme') === 'light') { document.documentElement.classList.add('light-theme'); document.addEventListener("DOMContentLoaded", function() { document.body.classList.add('light-theme'); }); }
document.addEventListener("DOMContentLoaded", function() {
    const wipeCanvas = document.createElement('canvas'); wipeCanvas.id = 'theme-wipe-canvas'; document.body.appendChild(wipeCanvas); const wctx = wipeCanvas.getContext('2d');
    function resizeWipe() { wipeCanvas.width = window.innerWidth; wipeCanvas.height = window.innerHeight; } resizeWipe(); window.addEventListener('resize', resizeWipe);
    const headerArtboard = document.querySelector('#rec3979597301 .t396__artboard'); if (!headerArtboard) return;

    const toggleBtn = document.createElement('button'); toggleBtn.className = 'theme-toggle-btn'; toggleBtn.setAttribute('aria-label', 'Переключатель темы');
    const iconContainer = document.createElement('div'); iconContainer.className = 'theme-icon-container';
    iconContainer.innerHTML = `<svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    toggleBtn.appendChild(iconContainer); headerArtboard.appendChild(toggleBtn);

    let wipeRadius = 0, maxRadius = 0, isWiping = false, wipeColor = '#F5F4F0', wipeStartX = 0, wipeStartY = 0;
    toggleBtn.addEventListener('click', function() {
        if (isWiping) return; const btnBounds = toggleBtn.getBoundingClientRect(); wipeStartX = btnBounds.left + btnBounds.width / 2; wipeStartY = btnBounds.top + btnBounds.height / 2;
        maxRadius = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)) * 1.1; const nextIsLight = !document.body.classList.contains('light-theme'); wipeColor = nextIsLight ? '#F5F4F0' : '#111211'; wipeRadius = 0; isWiping = true;
        function animateWipe() {
            if (!isWiping) return; wipeRadius += (maxRadius - wipeRadius) * 0.12 + 15; wctx.clearRect(0, 0, wipeCanvas.width, wipeCanvas.height);
            wctx.beginPath(); wctx.arc(wipeStartX, wipeStartY, wipeRadius, 0, Math.PI * 2); wctx.fillStyle = wipeColor; wctx.fill();
            if (wipeRadius >= maxRadius * 0.45 && isWiping) {
                if (nextIsLight) { document.body.classList.add('light-theme'); document.documentElement.classList.add('light-theme'); localStorage.setItem('theme', 'light'); }
                else { document.body.classList.remove('light-theme'); document.documentElement.classList.remove('light-theme'); localStorage.setItem('theme', 'dark'); }
            }
            if (wipeRadius >= maxRadius) { isWiping = false; wctx.clearRect(0, 0, wipeCanvas.width, wipeCanvas.height); return; } requestAnimationFrame(animateWipe);
        } requestAnimationFrame(animateWipe);
    });
});
