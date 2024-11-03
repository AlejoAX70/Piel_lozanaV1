const { createFlow } = require('@bot-whatsapp/bot')
const {welcomeFlow} = require('../flows/welcome.flow') 
const {flowSeller} = require('../flows/seller.flow')


module.exports = createFlow([welcomeFlow, flowSeller])