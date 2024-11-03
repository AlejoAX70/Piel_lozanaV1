

const { getResponseFromChatGPT, getResponseFromChatGPT2 } = require('../openIa/index.js')
const {getHistoryParse} = require('../utils/handleHistory.js')
const {flowSeller} = require("../flows/seller.flow")
const { chatPdf } = require('../chatPdf/index.js')

// import { flowSeller } from "../flows/seller.flow"
// import { flowSchedule } from "../flows/schedule.flow"

const PROMPT_DISCRIMINATOR = `### Historial de Conversación (Vendedor/Cliente) ###
{HISTORY}

### Intenciones del Usuario ###

**HABLAR**: Selecciona esta acción si el cliente parece querer hacer una pregunta o necesita más información.
**PROGRAMAR**: Selecciona esta acción si el cliente muestra intención de programar una cita.

### Instrucciones ###

Por favor, clasifica la siguiente conversación según la intención del usuario. solo escribe una de las opciones: HABLAR o PROGRAMAR, no escribas nada mas.`

module.exports = async (_, { state, gotoFlow, extensions }) => {
  
    return gotoFlow(flowSeller)
}