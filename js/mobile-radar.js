/* UMA · mobile-radar
   Перенесено из блока Тильды rec4222186401. */

document.addEventListener("DOMContentLoaded", function() {
    if (window.innerWidth > 1024) return;

    // Находим все ваши группы проектов по чистому классу
    const projectGroups = document.querySelectorAll('.project-group-card');
    if (projectGroups.length === 0) return;

    /* НАСТРОЙКА КИНЕТИЧЕСКОГО ЦЕНТРАЛЬНОГО РАДАРА */
    const radarObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Включаем фокус на всю группу Tilda разом
                entry.target.classList.add('is-focused');
            } else {
                // Плавно тушим, когда группа уходит с центра экрана
                entry.target.classList.remove('is-focused');
            }
        });
    }, { 
        root: null, 
        rootMargin: "-45% 0% -45% 0%", // Сканирующая полоса строго по центру экрана телефона
        threshold: 0 
    });

    // Запускаем слежку за каждой группой проектов
    projectGroups.forEach(group => {
        radarObserver.observe(group);
    });
});
