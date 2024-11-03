const { getResponseFromChatGPT } = require("../openIa/index.js");
const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { generateTimer } = require("../utils/generateTimer.js");
const {
  getHistoryParse,
  handleHistory,
  clearHistory,
} = require("../utils/handleHistory.js");
const { getFullCurrentDate } = require("../utils/currentDate.js");
const {
  createEvent,
  listEvents,
  updateEvent,
  deleteEventByDateAndId,
} = require("../calendar/calendar.js");
const { formatChatForAPI } = require("../utils/historyParse.js");
const { chatPdf } = require("../chatPdf/index.js");

const PROMPT_SELLER = `

Esta es la fecha y hora actuales: {CURRENT_DAY}. A partir de esta fecha y hora, puedes revisar y agendar citas. Usa el siguiente listado de citas como referencia para conocer las fechas ya ocupadas, en formato AAAA-MM-DD HH:MM. No menciones las citas específicas a menos que el cliente pregunte por disponibilidad, y responde de manera natural según el historial de conversación.

LAS CITAS DEBEN SER CON FECHA Y HORA, VERIFICA SIEMPRE QUE TENGA LA HORA 
**Citas ocupadas**: {DATES}

Si el cliente solicita una fecha sin citas programadas, infórmale de que está disponible.

Te proporcionaré el historial de conversación y, en base a este, responderás de manera natural:
Historial de la conversación: {HISTORY}
`;

const generatePromptSeller = (history, eventos) => {
  const nowDate = getFullCurrentDate();
  return PROMPT_SELLER.replace("{HISTORY}", history)
    .replace("{DATES}", eventos)
    .replace("{CURRENT_DAY}", nowDate);
};

const flowSeller = addKeyword(EVENTS.ACTION)
  .addAnswer(`⏱️`)
  .addAction(async (ctx, { state, flowDynamic, extensions }) => {

    
    try {
      const eventos = await listEvents();

      const history = getHistoryParse(state);

      const promptInfo = generatePromptSeller(history, eventos);
      console.log("promptInfo: ", promptInfo);
      
      const response = await chatPdf(promptInfo);

      const json = extractJSON(response);

      if (json) {
        console.log("JSON extraído: ", json);

        // Procesamos el JSON dependiendo del valor del campo "Proceso".
        if (json.Proceso === "Agendar") {
          const evento = await createEvent(
            `${json.Servicio}`,
            `${json.Servicio}... ${json.Fecha}... ${json.Lugar}... ${json.Cliente}, Contacto: ${json.Telefono}, Identificación: ${json.Cedula}`,
            `${json.Fecha}`,
            `${json.Lugar}`
          );

          if (!evento) {
            const mensaje =
              "¡No pudimos agendar tu cita!, selecciona otra fecha por favor";
            console.log("Mensaje: ", mensaje);
            await handleHistory({ content: mensaje, role: "assistant" }, state);

            await flowDynamic([
              { body: mensaje, delay: generateTimer(150, 250) },
            ]);
          } else {
            const mensaje =
             `
¡Tu cita ha sido agendada con éxito! 🎉 

Estos son los detalles de tu cita:

- **Servicio**: ${json.Servicio}
- **Fecha y Hora**: ${json.Fecha}
- **Lugar**: ${json.Lugar}
- **Nombre del Cliente**: ${json.Cliente}
- **Contacto**: ${json.Telefono}
- **Identificación**: ${json.Cedula}

¡Gracias por confiar en nosotros! Te contactaremos unas horas antes para confirmar tu cita. 😊
              `;
                          console.log("Mensaje: ", mensaje);

            await handleHistory({ content: mensaje, role: "assistant" }, state);
           
            await flowDynamic([
              { body: mensaje, delay: generateTimer(150, 250) },
            ]);
          }
        } else if (json.Proceso === "Editar") {
          const editar = await updateEvent(json);
          console.log("Editar response: ", editar);

          if(editar.id){
            const mensaje = `
*¡Tu cita ha sido actualizada con éxito! 📝*
            
Aquí están los detalles actualizados de tu cita:
            
📌 *Servicio*: ${json.Servicio}
🕒 *Fecha y Hora*: ${json.Fecha}
📍 *Lugar*: ${json.Lugar}
👤 *Nombre del Cliente*: ${json.Cliente}
📞 *Contacto*: ${json.Telefono}
🆔 *Identificación*: ${json.Cedula}
            
Gracias por avisarnos de los cambios. Nos aseguraremos de recordarte la cita en su nuevo horario.
            
*¡Nos vemos pronto!* 😊
            `;
            await handleHistory({ content: mensaje, role: "assistant" }, state);
          await flowDynamic([
            { body: mensaje, delay: generateTimer(150, 250) },
          ]);
          }else {
            await handleHistory({ content: editar, role: "assistant" }, state);

            await flowDynamic([
              { body: editar, delay: generateTimer(150, 250) },
            ]);
          }

          
        } else if (json.Proceso === "Eliminar"){
          console.log("Elimar: ", json);
          const deleted  = await deleteEventByDateAndId(json.Fecha, json.Cedula)
          console.log("deleted: ",deleted);

          if(deleted.id){
            const mensaje = `
*¡Tu cita ha sido candelada con éxito! 📝*`
          await handleHistory({ content: mensaje, role: "assistant" }, state);
          await flowDynamic([
            { body: mensaje, delay: generateTimer(150, 250) },
          ]);
          }else {
            await handleHistory({ content: deleted, role: "assistant" }, state);
          await flowDynamic([
            { body: deleted, delay: generateTimer(150, 250) },
          ]);
          }
          
        }
      } else {
        // Si no se detecta JSON, procesamos el mensaje como texto normal.
        await handleHistory({ content: response, role: "assistant" }, state);
        const chunks = response.split(/(?<!\d)\.\s+/g);
        for (const chunk of chunks) {
          await flowDynamic([
            { body: chunk.trim(), delay: generateTimer(150, 250) },
          ]);
        }
      }
    } catch (err) {
      console.log(`[ERROR]:`, err);
      return;
    }
  });

function extractJSON(response) {
  // Utilizamos una expresión regular para buscar el JSON dentro del mensaje.
  const jsonMatch = response.match(
    /\{(?:[^{}]|(?<rec>\{(?:[^{}]|\\k<rec>)*\}))*\}/
  );

  if (jsonMatch) {
    try {
      // Intentamos parsear el JSON encontrado.
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Error al parsear JSON: ", e);
      return null;
    }
  }
  return null;
}

module.exports = {
  flowSeller,
  generatePromptSeller,
};
