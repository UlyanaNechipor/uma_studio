/* UMA · trail
   Перенесено из блока Тильды rec4044167501. */

document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'trail-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Координаты ввода в реальном времени
    let mouseX = -1000;
    let mouseY = -1000;
    
    // Сглаженные координаты головы червячка
    let smoothedX = -1000;
    let smoothedY = -1000;

    // КОЭФФИЦИЕНТ ПЛАВНОСТИ: 0.08 — дает мягкое, ленивое скольжение
    const ease = 0.08; 

    let points = [];
    const maxPoints = 55; // Длина хвоста

    // 1. ДЕСКТОП: Движение мыши (осталось идеальным)
    window.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        initSmoothCoordinates();
    });

    // 2. МОБИЛКА: Принудительный мгновенный трекинг тача
    // { passive: false } сообщает браузеру, что мы перехватываем управление жестом
    window.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            initSmoothCoordinates();
        }
    }, { passive: false });

    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            // Разрешаем рисовать след прямо во время листания страницы, убирая микрофризы
            initSmoothCoordinates();
        }
    }, { passive: false });

    // Плавно тушим хвост при отрыве пальца или уходе мыши
    function resetInput() {
        mouseX = -1000;
        mouseY = -1000;
    }
    window.addEventListener('touchend', resetInput);
    window.addEventListener('touchcancel', resetInput);
    window.addEventListener('mouseleave', resetInput);

    function initSmoothCoordinates() {
        if (smoothedX === -1000) {
            smoothedX = mouseX;
            smoothedY = mouseY;
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ИНЕРЦИОННОЕ СГЛАЖИВАНИЕ
        if (mouseX !== -1000) {
            smoothedX += (mouseX - smoothedX) * ease;
            smoothedY += (mouseY - smoothedY) * ease;

            const dist = Math.sqrt(Math.pow(smoothedX - (points[0]?.x || 0), 2) + Math.pow(smoothedY - (points[0]?.y || 0), 2));
            
            if (dist > 1) {
                points.unshift({ x: smoothedX, y: smoothedY, alpha: 1 });
                if (points.length > maxPoints) {
                    points.pop();
                }
            }
        } else {
            smoothedX = -1000;
            smoothedY = -1000;
        }

        if (points.length > 0) {
            for (let i = 0; i < points.length; i++) {
                points[i].alpha -= 0.022; 
            }
            points = points.filter(p => p.alpha > 0);
        }

        if (points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];

                const xc = (p1.x + p2.x) / 2;
                const yc = (p1.y + p2.y) / 2;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);

                const progress = (maxPoints - i) / maxPoints;
                ctx.lineWidth = 85 * Math.pow(progress, 1.4); 
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const currentAlpha = Math.max(0, p1.alpha * progress);

                const gradient = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, ctx.lineWidth);
                gradient.addColorStop(0, `rgba(255, 240, 215, ${0.85 * currentAlpha})`); 
                gradient.addColorStop(0.25, `rgba(224, 130, 68, ${0.55 * currentAlpha})`); 
                gradient.addColorStop(0.65, `rgba(190, 100, 45, ${0.12 * currentAlpha})`); 
                gradient.addColorStop(1, 'rgba(17, 18, 17, 0)');

                ctx.strokeStyle = gradient;
                ctx.stroke();
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
