state: Удаление
    q!: * (удали|удалить) * [запись|расход] * [из категории] * $Category::category
    script:
        var id = getIdBySelectedItem(getRequest($context));
        var category = $parseTree._category || "Другое";
        if (id) {
            deleteNote(id, $context, category);
            reply("Запись удалена из категории \"" + category + "\"", $context.response);
        } else {
            reply("Не удалось определить, какую запись удалить.", $context.response);
        }
    category: Управление записями