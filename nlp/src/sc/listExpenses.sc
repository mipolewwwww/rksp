state: СписокРасходов
    q!: * (покажи|выведи|открой) * [список|перечень] * [расходов|трат] *
    script:
        var category = $parseTree._category || "Все категории";
        var expenses = getFormattedExpenses(getRequest($context), category);
        reply(expenses || "Нет данных о расходах" + (category !== "Все категории" ? " в категории " + category : ""), $context.response);
    category: Просмотр данных