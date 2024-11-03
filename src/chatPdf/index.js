const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require('path');

const createPdf = () => {
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(path.join(__dirname, '../../piel_lozana4_cancelacion.pdf'))
    );
    
    const options = {
      headers: {
        "x-api-key": process.env.API_KEY,
        ...formData.getHeaders(),
      },
    };
    
    axios
      .post("https://api.chatpdf.com/v1/sources/add-file", formData, options)
      .then((response) => {
        console.log("Source ID:", response.data.sourceId);
      })
      .catch((error) => {
        console.log("Error:", error.message);
        console.log("Response:", error.response.data);
      });
}


const chatPdf = async (message) => {
    const config = {
        headers: {
            "x-api-key": process.env.API_KEY,
            "Content-Type": "application/json",
        },
    };
    const data = {
        sourceId: process.env.PDF_ID,
        messages: [
          {
            role: "user",
            content: `${message}`,
          },
        ],
      };

    try {
        const response = await axios.post("https://api.chatpdf.com/v1/chats/message", data, config);
        console.log("Result:", response.data.content);
        return response.data.content;
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response && error.response.data) {
            console.log("Response:", error.response.data);
        } else {
            console.log("No response data available.");
        }
        throw error; // Si quieres manejar el error en otra parte, podrías lanzarlo aquí
    }
};




module.exports = {
    createPdf,
    chatPdf
}

