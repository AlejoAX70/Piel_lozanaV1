const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPEN_IA, // Inserta tu clave de API aquí
});

// Función para interactuar con la API de ChatGPT
async function getResponseFromChatGPT(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo', // También puedes usar 'gpt-4' si tienes acceso
            messages: [{ role: 'user', content: prompt }],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error en getResponseFromChatGPT:', error);
        return null;
    }
}


async function getResponseFromChatGPT2(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // También puedes usar 'gpt-4' si tienes acceso
            messages: [{ role: 'user', content: prompt }],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error en getResponseFromChatGPT:', error);
        return null;
    }
}

// Función para crear un nuevo thread y run

// Función para enviar un mensaje
async function enviarMensaje(message, ) {
    try {

        const thread = await openai.beta.threads.create();

       
        const messages = await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: message
        }); 

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: "asst_AdSk5uy0XWvbojPFlsGW9dQV",
            instructions: "general user",
        });

        console.log("messages: ", messages);

        console.log("run: ", run);

        
    } catch (error) {
        console.error('Error en enviarMensaje:', error);
        return null;
    }
}

// Llama a la función createThreadAndRun y luego usa enviarMensaje


// Exportar las funciones
module.exports = {
    getResponseFromChatGPT,
    enviarMensaje,
    getResponseFromChatGPT2
    
};
