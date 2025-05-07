function addNote(title, context, amount, category = "Другое") {
    const id = Date.now().toString(); // Генерируем уникальный ID
    console.log("Adding note:", { id, title, amount, category });
    
    addAction({
        type: "add_note",
        action: {  // Добавляем вложенность action для SberAssistant
            id: id,
            title: title,
            amount: parseFloat(amount),
            category: category
        }
    }, context);
    
    return id;
}

function deleteNote(id, context, category = "Другое") {
    console.log(`[DEBUG] Deleting note:`, { id, category });
    addAction({
        type: "delete_note",
        id: id,
        category: category
    }, context);
}

function updateNotePrice(id, context, newPrice, category) {
    console.log(`[DEBUG] Updating price:`, { id, newPrice, category });
    addAction({
        type: "update_note_price",
        id: id,
        newPrice: parseFloat(newPrice),
        category: category
    }, context);
}

function updateNoteText(id, context, newText, category = "Другое") {
    console.log(`[DEBUG] Updating text:`, { id, newText, category });
    addAction({
        type: "update_note_text",
        id: id,
        newText: newText,
        category: category
    }, context);
}

function movePriceToNote(sourceCategory = "Другое", targetCategory = "Другое", amount, context) {
    console.log(`[DEBUG] Moving price:`, { sourceCategory, targetCategory, amount });
    addAction({
        type: "move_price",
        sourceCategory: sourceCategory,
        targetCategory: targetCategory,
        amount: parseFloat(amount)
    }, context);
}
function addCategory(categoryName, context) {
    console.log(`[DEBUG] Adding category:`, categoryName);
    addAction({
        type: "add_category",
        name: categoryName.trim()
    }, context);
}

function listExpenses(context, period = "месяц") {
    console.log(`[DEBUG] Listing expenses for:`, period);
    addAction({
        type: "list_expenses",
        period: period
    }, context);
}

function logAction(action, context) {
    console.log('Action performed:', action);
    reply({ status: 'success', action }, context.response);
}