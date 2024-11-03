require('dotenv').config();
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const flow = require('./flows')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { findEventsStartingInOneHour } = require('./calendar/calendar')




const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow,
        provider: adapterProvider,
        database: adapterDB,
    })
    

    QRPortalWeb()
}
const buscarFechas = async () => {
    const citas = await findEventsStartingInOneHour()
    console.log("Citas: ", citas);
    
}


buscarFechas()
main()
