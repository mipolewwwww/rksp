state: ИзменениеЦены
    q!: * (измени|обнови|поправь) * [цену|стоимость] * [на] * $Number::newPrice *
    script:
        var id = getIdBySelectedItem(getRequest($context));
        var category = $parseTree._category || "Другое";
        if (id) {
            updateNotePrice(id, $context, $parseTree._newPrice, category);
            a: Цена обновлена на {$parseTree._newPrice}₽ (категория: {category});
        } else {
            a: Не удалось найти запись для изменения;
        }
    category: Управление финансами