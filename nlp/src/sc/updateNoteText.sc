state: ИзменениеТекста
    q!: * (измени|обнови) * [текст|описание] * [на] * $AnyText::newText *
    script:
        var id = getIdBySelectedItem(getRequest($context));
        var category = $parseTree._category || "Другое";
        if (id) {
            updateNoteText(id, $context, $parseTree._newText, category);
            a: Текст обновлён на "{$parseTree._newText}" (категория: {category});
        } else {
            a: Не удалось найти запись для изменения;
        }
    category: Редактирование записей