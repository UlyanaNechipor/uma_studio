/* UMA · rem
   Перенесено из блока Тильды rec3979598201. */

document.addEventListener("DOMContentLoaded", function() {
    // Находим все элементы с нашим классом
    const elements = document.querySelectorAll('.rem-text');

    elements.forEach(el => {
        // Находим внутренний атом-тег Tilda, куда она пишет px
        const atom = el.closest('.tn-atom') || el.querySelector('.tn-atom') || el;
        // Удаляем инлайн font-size, чтобы сработал наш CSS с rem
        atom.style.setProperty('font-size', '', 'important');
    });
});
