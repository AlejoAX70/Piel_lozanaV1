


const { handleHistory } = require('../utils/handleHistory.js')

/**
 * Su funcion es almancenar en el state todos los mensajes que el usuario  escriba
 */
module.exports = async ({ body }, { state }) => {
   await handleHistory({ content: body, role: 'user' }, state)
}