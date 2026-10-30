/* UMA · prepositions
   Перенесено из блока Тильды rec3979598301. */

document.addEventListener("DOMContentLoaded", function() {
    // Запускаем скрипт с микрозадержкой, чтобы Tilda успела сделать автоскейл
    setTimeout(function() {
        // Кристально чистый массив предлогов и союзов (регистр подхватит регулярка)
               const prepositions = [
            'в', 'во', 'с', 'со', 'из', 'изо', 'к', 'ко', 'о', 'об', 'обо', 'от', 'ото', 'до', 
            'по', 'под', 'подо', 'про', 'на', 'за', 'над', 'надо', 'через', 'сквозь', 'у', 'при', 
            'пред', 'предо', 'перед', 'передо', 'а', 'и', 'но', 'да', 'или', 'не', 'ни', 'бы', 'же',
            'вы', 'мы', 'ты', 'он', 'она', 'они', 'оно', 'я', 'то', 'все', 'что', 'кто', 'мой', 'свой',
            'для', 'без', 'безо', 'ради', 'около', 'возле', 'вокруг', 'после', 'кроме', 'среди', 'между',
            'как', 'чем', 'ли', 'это', 'их', 'его', 'её', 'ее', 'наш', 'ваш'
        ];

        // Находим контейнер со всеми блоками Tilda
        const allBlocks = document.getElementById('allrecords');
        if (!allBlocks) return;

        // Создаем эффективный обходчик текстовых узлов (TreeWalker)
        const walker = document.createTreeWalker(
            allBlocks, 
            NodeFilter.SHOW_TEXT, 
            {
                acceptNode: function(node) {
                    const parent = node.parentNode;
                    const parentName = parent.nodeName;
                    
                    // Игнорируем скрипты, стили, пустые строки и кнопки меню/переключателя
                    if (
                        parentName === 'SCRIPT' || 
                        parentName === 'STYLE' || 
                        !node.nodeValue.trim() ||
                        parent.closest('.theme-toggle-btn') ||
                        parent.closest('.t-menu__link-item')
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let node;
        // Перебираем абсолютно весь текст на странице
        while (node = walker.nextNode()) {
            let text = node.nodeValue;
            
            prepositions.forEach(prep => {
                // Бронебойный поиск предлога с флагом 'i' (игнорирует регистр: заглавные/строчные)
                // Захватывает начало строки или пробелы, привязывая предлог к следующему слову
                const regex = new RegExp('(?:^|\\s+)(' + prep + ')\\s+', 'gi');
                // Заменяем обычный пробел после предлога на жесткий неразрывный юникод (\u00A0)
                text = text.replace(regex, function(match, p1) {
                    // Сохраняем исходный отступ перед предлогом и вклеиваем неразрывное ушко
                    const leadingSpace = match.match(/^\s+/);
                    return (leadingSpace ? leadingSpace[0] : '') + p1 + '\u00A0';
                });
            });

            // Обновляем текст в структуре сайта без перезаписи HTML-тегов
            if (node.nodeValue !== text) {
                node.nodeValue = text;
            }
        }
    }, 400); // 400 миллисекунд достаточно, чтобы Tilda завершила трансформацию масштаба
});
