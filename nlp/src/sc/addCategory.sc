state: ДобавлениеКатегории
    q!: * (добавь|создай) * [категорию] * $Word::categoryName *
    script:
        var name = $parseTree._categoryName || "Другое";
        addCategory(name, $context);
        reply("Категория \"" + name + "\" добавлена", $context.response);
    category: Управление категориями