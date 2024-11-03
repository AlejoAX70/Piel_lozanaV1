

const { EVENTS, addKeyword } = require('@bot-whatsapp/bot')
const mainLayer = require('../layers/main.layer.js')
const conversationalLayer = require('../layers/conversational.layer.js')

const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(conversationalLayer)
    .addAction(mainLayer)

module.exports = {
    welcomeFlow
}