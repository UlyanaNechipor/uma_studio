/* UMA · project-preview
   Перенесено из блока Тильды rec4582105101. */

document.addEventListener("DOMContentLoaded", function() {
    // -------------------------------------------------------------
    // БАЗА ДАННЫХ ВАШИХ КАРТИНОК:
    // Ссылка для первого проекта уже на месте. Для остальных просто 
    // заменяйте адреса в кавычках на свои по аналогии!
    // -------------------------------------------------------------
    const projectImages = {
        '.pr-1': 'https://optim.tildacdn.com/tild6666-6631-4862-b134-313063336533/-/format/webp/Frame_758532524_1.jpg.webp', // Ваша картинка для 1-го проекта
        '.pr-2': 'https://unsplash.com', // Для 2-го проекта
        '.pr-3': 'https://unsplash.com', // Для 3-го проекта
        '.pr-4': 'https://unsplash.com', // Для 4-го проекта
        '.pr-5': 'https://unsplash.com', // Для 5-го проекта
        '.pr-6': 'https://unsplash.com', // Для 6-го проекта
        '.pr-7': 'https://unsplash.com', // Для 7-го проекта
        '.pr-8': 'https://unsplash.com', // Для 8-го проекта
        '.pr-9': 'https://unsplash.com', // Для 9-го проекта
        '.pr-10': 'https://unsplash.com'  // Для 10-го проекта
    };

    // Создаем элемент для плавающей карточки
    const popup = document.createElement('div');
    popup.className = 'project-preview-popup';
    document.body.appendChild(popup);

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    const ease = 0.09; // Скорость/плавность следования карточки за мышкой

    window.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Связываем ховеры на строчках с выводом картинок из базы данных
    Object.keys(projectImages).forEach(selector => {
        const rows = document.querySelectorAll(selector);
        
        rows.forEach(row => {
            // Мышь зашла на проект
            row.addEventListener('mouseenter', function() {
                popup.style.backgroundImage = `url('${projectImages[selector]}')`;
                popup.classList.add('is-active');
            });

            // Мышь ушла с проекта
            row.addEventListener('mouseleave', function() {
                popup.classList.remove('is-active');
            });
        });
    });

    // Математический цикл анимации LERP для плавного перемещения без рывков
    function animatePopup() {
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;

        popup.style.left = currentX + 'px';
        popup.style.top = currentY + 'px';

        requestAnimationFrame(animatePopup);
    }
    animatePopup();
});
