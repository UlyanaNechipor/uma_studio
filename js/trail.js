/* UMA · trail
   Перенесено из блока Тильды rec4044167501.
   Производительность: холст рисуется в половинном разрешении (он всё равно
   размыт фильтром), кадры считаются только пока след виден, а в покое холст
   скрыт — размытие на весь экран не пересчитывается на каждом кадре прокрутки.
   Обработчики касаний пассивные: они больше не тормозят прокрутку на телефоне. */

document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'trail-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const RES = 0.25; // доля разрешения холста: картинка растягивается браузером и сама получается мягкой —
                      // вместо размытия фильтром на весь экран (оно и смешивание слоёв тормозили всю страницу)
    // акцентный цвет из --uma-accent (задаётся во вставке Тильды), по умолчанию #d94f30
    const ACC = (function () {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--uma-accent').trim() || '#d94f30';
        const m = v.match(/^#([0-9a-f]{6})$/i);
        if (!m) return '217, 79, 48';
        const n = parseInt(m[1], 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
    })();
    function resizeCanvas() {
        canvas.width = Math.ceil(window.innerWidth * RES);
        canvas.height = Math.ceil(window.innerHeight * RES);
        ctx.setTransform(RES, 0, 0, RES, 0, 0);
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
        wake();
    });

    // 2. МОБИЛКА: Принудительный мгновенный трекинг тача
    // пассивный обработчик: браузер не ждёт скрипт перед прокруткой
    window.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            initSmoothCoordinates();
            wake();
        }
    }, { passive: true });

    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            initSmoothCoordinates();
            wake();
        }
    }, { passive: true });

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

    // цикл кадров работает, только пока след есть на экране
    let running = false;
    function wake() {
        if (running) return;
        running = true;
        canvas.style.visibility = 'visible';
        requestAnimationFrame(animate);
    }

    let light = false;
    function animate() {
        light = document.body.classList.contains('light-theme');
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

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
                gradient.addColorStop(0.25, `rgba(${ACC}, ${0.55 * currentAlpha})`); 
                gradient.addColorStop(0.65, `rgba(170, 55, 30, ${0.12 * currentAlpha})`); 
                gradient.addColorStop(1, 'rgba(17, 18, 17, 0)');

                ctx.strokeStyle = gradient;
                ctx.stroke();
            }
        }

        // всё погасло и ввода нет: останавливаемся и прячем холст до следующего движения
        const settled = mouseX === -1000 || (Math.abs(mouseX - smoothedX) < 1 && Math.abs(mouseY - smoothedY) < 1);
        if (!points.length && settled) {
            running = false;
            canvas.style.visibility = 'hidden';
            return;
        }
        requestAnimationFrame(animate);
    }

    canvas.style.visibility = 'hidden';
});
