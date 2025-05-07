// entryPoint.sc
require: slotfilling/slotFilling.sc
  module = sys.zb-common

require: js/getters.js
require: js/reply.js
require: js/actions.js

require: sc/addNote.sc
require: sc/deleteNote.sc
require: sc/listExpenses.sc
require: sc/addCategory.sc
require: sc/movePriceToNote.sc
require: sc/updateNotePrice.sc
require: sc/updateNoteText.sc

patterns:
    $Category = $Word | "Продукты" | "Транспорт" | "ЖКХ" | "Развлечения" | "Одежда" | "Другое"

theme: /
    state: Start
        q!: $regex</start>
        a: Добро пожаловать в трекер расходов!

    state: Fallback
        event!: noMatch
        a: Я не понимаю. Попробуйте сказать "Добавить расход" или "Показать траты".