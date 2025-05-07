state: ПереносСредств
    q!: * (перенести|переместить) * * [из категории] * $Word::sourceCategory * * [в категорию] * $Word::targetCategory * * [сумму] * $Number::amount *
    script:
        var source = $parseTree._sourceCategory || "Другое";
        var target = $parseTree._targetCategory || "Другое";
        var sum = $parseTree._amount;
        movePriceToNote(source, target, sum, $context);
        reply("Перенесено " + sum + "₽ из " + source + " в " + target, $context.response);
    category: Управление финансами