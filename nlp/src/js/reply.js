function formatResponse(template, variables) {
    return template
        .replace(/{title}/g, variables.title || "")
        .replace(/{price}/g, variables.price || "")
        .replace(/{category}/g, variables.category || "");
}

function reply(body, response) {
    if (!response.replies) {
        response.replies = [];
    }
    response.replies.push({
        type: "raw",
        body: body
    });
}

function addAction(action, context) {
    const command = {
        type: "smart_app_data",
        action: action
    };

    for (let i = 0; context.response.replies && i < context.response.replies.length; i++) {
        if (context.response.replies[i].type === "raw" && context.response.replies[i].body?.items) {
            context.response.replies[i].body.items.push({ command });
            return;
        }
    }

    reply({ items: [{ command }] }, context.response);
}

function addSuggestions(suggestions, context) {
    const buttons = suggestions.map(suggest => ({
        title: suggest,
        action: {
            type: "text",
            text: suggest
        }
    }));
    reply({ suggestions: { buttons } }, context.response);
}

function addCategoriesList(categories, context) {
    const buttons = categories.map(category => ({
        title: category,
        action: {
            type: "text",
            text: `Покажи расходы в категории ${category}`
        }
    }));
    reply({ suggestions: { buttons, title: "Категории расходов" } }, context.response);
}  
function getCategory(request) {
    return request?.payload?.meta?.current_app?.state?.category || "Другое";
}

// Обновляем функцию getFormattedExpenses
function getFormattedExpenses(request, category = "Все") {
    const notes = getItems(request);
    const filtered = category === "Все" 
        ? notes 
        : notes.filter(item => item.category === category);
    return filtered.map(n => `${n.title}: ${n.price}₽ (${n.category})`).join('\n');
}