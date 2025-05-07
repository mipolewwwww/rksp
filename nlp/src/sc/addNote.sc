state: Добавить Расход
    q!: * (добавь|добавить) * [$AnyText::title] * [за|по цене] * $Number::amount * [₽|рублей|р] * [в категории|в категорию] * $Category::category
    script:
        var title = $parseTree._title;
        var amount = $parseTree._amount;
        var category = $parseTree._category || "Другое";
        addNote(title, $context, amount, category);
        
        // Исправленный ответ с реальными значениями
        reply(`Добавлено: "${title}" за ${amount}₽ (категория: ${category})`, $context.response);
    category: Управление записями