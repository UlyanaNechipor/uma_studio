/* UMA · loops
   Перенесено из блока Тильды rec4411494701. */

document.addEventListener("DOMContentLoaded", function() {
    function initUMALoops() {
        const mobilesContainer = document.querySelector('.uma-loop-mobiles');
        const desktopsContainer = document.querySelector('.uma-loop-desktops');

        if (!mobilesContainer || !desktopsContainer) return;

        // БОМБИЧЕСКИЙ КЛОН-МЕТОД: Копируем исходные элементы внутрь контейнеров,
        // создавая бесконечный бесшовный дубликат для иллюзии вечного цикла
        mobilesContainer.innerHTML += mobilesContainer.innerHTML;
        desktopsContainer.innerHTML += desktopsContainer.innerHTML;

        // Ждем окончания загрузки оранжевого прелоадера и мягко включаем бесконечные стримы
        setTimeout(function() {
            document.documentElement.classList.add('uma-loop-running');
            document.body.classList.add('uma-loop-running');
        }, 2700);
    }

    // Запускаем инициализацию лент
    initUMALoops();
});
