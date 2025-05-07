function getRequest(context) {
    return context?.request?.rawRequest || {};
}

function getServerAction(request) {
    return request?.payload?.data?.server_action || {};
}

function getScreen(request) {
    return request?.payload?.meta?.current_app?.state?.screen || "";
}

function getSelectedItem(request) {
    return request?.payload?.selected_item || null;
}

function getItems(request) {
    return request?.payload?.meta?.current_app?.state?.item_selector?.items || [];
}

function getCategories(request) {
    return request?.payload?.meta?.current_app?.state?.categories || [];
}

function getIdBySelectedItem(request) {
    const items = getItems(request);
    const selectedItem = getSelectedItem(request);
    if (selectedItem && items[selectedItem.index]) {
        return items[selectedItem.index].id;
    }
    return null;
}

function getNoteById(request, id) {
    return getItems(request).find(item => item.id === id) || null;
}

function getNotesByCategory(request, category) {
    return getItems(request).filter(item => item.category === category);
}

function getFormattedExpenses(request, period = "месяц") {
    const notes = getItems(request);
    return notes.map(n => `${n.title}: ${n.price}₽ (${n.category})`).join('\n');
}
