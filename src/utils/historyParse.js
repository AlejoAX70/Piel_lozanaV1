function formatChatForAPI(conversationText) {
    // Divide el texto en líneas
    const lines = conversationText.split('\n');
  
    // Array para almacenar los mensajes formateados
    const messages = [];
  
    // Recorrer cada línea
    lines.forEach(line => {
      // Elimina los espacios innecesarios
      const trimmedLine = line.trim();
  
      // Ignorar líneas vacías
      if (!trimmedLine) return;
  
      // Identificar el rol y el contenido
      let role = '';
      let content = '';
  
      if (trimmedLine.startsWith('Customer:')) {
        role = 'user';
        content = trimmedLine.replace('Customer:', '').trim();
      } else if (trimmedLine.startsWith('Seller:')) {
        role = 'assistant';
        content = trimmedLine.replace('Seller:', '').trim();
      }
  
      // Si se ha identificado el rol, agregar el mensaje al array
      if (role && content) {
        messages.push({
          role: role,
          content: content
        });
      }
    });
  
    // Estructura final para enviar a la API
    const apiPayload = {
      sourceId: "src_HqBJtjnCpqMipnlujlmkn", // Reemplaza con tu sourceId
      messages: messages
    };
  
    return JSON.stringify(apiPayload, null, 2);
  }

  module.exports = {
    formatChatForAPI
  }