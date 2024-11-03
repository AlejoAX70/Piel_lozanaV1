const {google} = require('googleapis')
const path = require('path');

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../google.json'),
    scopes: ['https://www.googleapis.com/auth/calendar']
})

const calendar = google.calendar({version: "v3"})

const calendarID = process.env.CALENDAR_ID
const timeZone = 'America/Bogota'


const rangeLimit = {
    days: [1, 2, 3, 4, 5, 6],
    startHour: 9,
    endHour: 18
}

const standarDuration = 1
const dateLimit = 30

async function createEvent(eventName, description, date, location, duration = standarDuration) {
    console.log("eventName: ", eventName);
    console.log("description: ", description);
    console.log("date: ", date);
    console.log("duration: ", duration);

    try {
        // Convertimos la fecha a objeto Date
        const startDateTime = new Date(date);

        // Paso 0: Verificar si la fecha es domingo
        const dayOfWeek = startDateTime.getUTCDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
        if (dayOfWeek === 0) { // Si es domingo, retorna y no crea el evento
            console.log("No se pueden agendar eventos en domingo.");
            return null;
        }

        // Paso 1: Verificar disponibilidad en el rango de fecha y hora
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + duration);

        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        const checkAvailability = await calendar.events.list({
            calendarId: calendarID,
            timeMin: startDateTime.toISOString(),
            timeMax: endDateTime.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = checkAvailability.data.items;
        if (events.length) {
            console.log("Ya existe un evento en este horario. No se puede agendar.");
            return null; // Retorna null si hay un conflicto de horario
        }

        // Paso 2: Crear el evento si no hay conflictos de horario
        const event = {
            summary: eventName,
            description: description,
            location: location,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: timeZone,
            },
            colorId: '2',
        };

        const response = await calendar.events.insert({
            calendarId: calendarID,
            resource: event,
        });

        const eventId = response.data.id;
        console.log("Evento creado con éxito.");
        return eventId;

    } catch (error) {
        console.error('Error al crear el evento:', error);
        throw error;
    }
}


async function listEvents() {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(now.getDate() + 30);

        const response = await calendar.events.list({
            calendarId: calendarID,
            timeMin: now.toISOString(),
            timeMax: maxDate.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items;

        if (events.length) {
            let formattedEvents = '';
            events.forEach((event, index) => {
                const startDateTime = new Date(event.start.dateTime || event.start.date);
                const endDateTime = new Date(event.end.dateTime || event.end.date);

                const formattedStartDate = `${startDateTime.getFullYear()}-${String(startDateTime.getMonth() + 1).padStart(2, '0')}-${String(startDateTime.getDate()).padStart(2, '0')}`;
                const formattedStartTime = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;

                const formattedEndDate = `${endDateTime.getFullYear()}-${String(endDateTime.getMonth() + 1).padStart(2, '0')}-${String(endDateTime.getDate()).padStart(2, '0')}`;
                const formattedEndTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

                formattedEvents += `${index + 1}. Cita: ${event.summary}\n`;
                formattedEvents += `Fecha de inicio: ${formattedStartDate}, Hora de inicio: ${formattedStartTime}\n`;
                formattedEvents += `Fecha de fin: ${formattedEndDate}, Hora de fin: ${formattedEndTime}\n\n`;
            });

            console.log('Eventos formateados:\n', formattedEvents);
            return formattedEvents;
        } else {
            console.log('No se encontraron eventos en el rango de 30 días.');
            return 'No se encontraron eventos en el rango de 30 días.';
        }
    } catch (error) {
        console.error('Error al listar los eventos:', error);
        throw error;
    }
}



async function findEventByDescriptionAndDate(description, date) {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        // Definir la fecha de inicio y fin para la búsqueda en la fecha específica
        const startDateTime = new Date(date);
        startDateTime.setHours(0, 0, 0, 0); // Comenzar a las 00:00 de la fecha dada

        const endDateTime = new Date(date);
        endDateTime.setHours(23, 59, 59, 999); // Terminar a las 23:59 de la misma fecha

        const response = await calendar.events.list({
            calendarId: calendarID,
            timeMin: startDateTime.toISOString(),
            timeMax: endDateTime.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items;

        // Filtrar los eventos por la descripción que incluya la cédula del cliente
        const matchedEvents = events.filter(event => 
            event.description && event.description.includes(description)
        );

        if (matchedEvents.length) {
            console.log("Eventos encontrados:", matchedEvents);
            return matchedEvents;
        } else {
            console.log("No se encontraron eventos con la descripción y fecha especificadas.");
            return [];
        }
    } catch (error) {
        console.error('Error al buscar el evento:', error);
        throw error;
    }
}



async function updateEvent(newDetails) {
    try {
        const matchedEvents = await findEventByDescriptionAndDate(newDetails.Cedula, newDetails.Fecha_anterior);

        if (matchedEvents.length === 0) {
            console.log("No se encontró ningún evento con la descripción y fecha especificadas.");
            return "No se encontró ningún evento con la descripción y fecha especificadas.";
        }

        console.log("Evento: ", matchedEvents);
        

        const eventToUpdate = matchedEvents[0];
        const eventId = eventToUpdate.id;
        // Paso 1: Buscar el evento
        if(newDetails.Cambio_fecha == true){
           


            const newStartDateTime = new Date(newDetails.Fecha);
            
            const endDateTime = new Date(newStartDateTime);
            endDateTime.setHours(newStartDateTime.getHours() + standarDuration);

            const checkAvailability = await calendar.events.list({
                calendarId: calendarID,
                timeMin: newStartDateTime.toISOString(),
                timeMax: endDateTime.toISOString(),
                timeZone: timeZone,
                singleEvents: true,
                orderBy: 'startTime',
            });
    
            const events = checkAvailability.data.items;
            if (events.length) {
                console.log("Disculpame, ¡ya hay una cita programada en esta fecha!");
                return "Disculpame, ¡ya hay una cita programada en esta fecha!"; // Retorna null si hay un conflicto de horario
            }
            

            const updatedEvent = {
                summary: `${newDetails.Servicio}`,
                description: `${newDetails.Servicio}... ${newDetails.Fecha}... ${newDetails.Lugar}... ${newDetails.Cliente}, Contacto: ${newDetails.Telefono}, Identificación: ${newDetails.Cedula}`,
                location: `${newDetails.Lugar}`,
                start: {
                    dateTime: newStartDateTime.toISOString(),
                    timeZone: timeZone,
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: timeZone,
                },
               
            };

            const response = await calendar.events.update({
                calendarId: calendarID,
                eventId: eventId,
                resource: updatedEvent,
            });
            console.log("Evento actualizado con éxito:", response.data);
            return response.data;
    
        }else {


            console.log("datos del usuario: ", newDetails);
            console.log("Evento en el calendario: ", matchedEvents);

            const updatedEvent = {
                summary: `${newDetails.Servicio}`,
                description: `${newDetails.Servicio}... ${newDetails.Fecha}... ${newDetails.Lugar}... ${newDetails.Cliente}, Contacto: ${newDetails.Telefono}, Identificación: ${newDetails.Cedula}`,
                location: `${newDetails.Lugar}`,
                start: {
                    dateTime: newStartDateTime.toISOString(),
                    timeZone: timeZone,
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: timeZone,
                },
               
            };

            const response = await calendar.events.update({
                calendarId: calendarID,
                eventId: eventId,
                resource: updatedEvent,
            });
            console.log("Evento actualizado con éxito:", response.data);
            return response.data;

            

        }
      
    } catch (error) {
        console.error("Error al actualizar el evento:", error);
        return "!Hubo un error al actualizar el evento¡";
    }
}


async function findEventsStartingInOneHour() {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        // Obtener la hora actual y una hora después
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        // Configurar los parámetros de búsqueda para eventos que comiencen entre `now` y `oneHourLater`
        const response = await calendar.events.list({
            calendarId: calendarID,
            timeMin: now.toISOString(),
            timeMax: oneHourLater.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items;

        // Filtrar eventos que comiencen en el futuro dentro de una hora y aún no hayan comenzado
        const upcomingEvents = events.filter(event => {
            const eventStartTime = new Date(event.start.dateTime || event.start.date);
            return eventStartTime > now; // Filtrar eventos que comiencen después de `now`
        });

        if (upcomingEvents.length) {
            console.log("Eventos que comienzan en una hora:", upcomingEvents);
            return upcomingEvents;
        } else {
            console.log("No hay eventos que comiencen en una hora.");
            return [];
        }
    } catch (error) {
        console.error('Error al buscar eventos próximos:', error);
        throw error;
    }
}

async function deleteEventByDateAndId(date, cedula) {
    try {
        // Obtener la fecha y hora actual
        const now = new Date();

        // Buscar eventos que coincidan con la fecha y cédula
        const matchedEvents = await findEventByDescriptionAndDate(cedula, date);

        if (matchedEvents.length === 0) {
            console.log("No se encontró ningún evento con la descripción y fecha especificadas.");
            return "No se encontró ningún evento con la descripción y fecha especificadas.";
        }

        // Verificar la diferencia de tiempo y eliminar solo si faltan más de 3 horas
        for (const event of matchedEvents) {
            const eventStartTime = new Date(event.start.dateTime || event.start.date);
            const timeDifferenceInHours = (eventStartTime - now) / (1000 * 60 * 60); // Diferencia en horas

            if (timeDifferenceInHours > 3) {
                // Si faltan más de 3 horas, eliminamos el evento
                await calendar.events.delete({
                    calendarId: calendarID,
                    eventId: event.id,
                });
                console.log(`Evento con ID ${event.id} eliminado correctamente.`);
            } else {
                // Si faltan menos de 3 horas, no se permite la eliminación
                console.log(`No se puede eliminar el evento con ID ${event.id} porque faltan menos de 3 horas.`);
                return `Estimado cliente, lamentamos informarle que no es posible cancelar su evento porque no se encuentra dentro del tiempo permitido. Las cancelaciones deben realizarse con al menos 3 horas de antelación para poder procesarlas. Agradecemos su comprensión y estamos aquí para ayudarle con cualquier otra solicitud.`;
            }
        }

        return "Proceso de eliminación completado.";
    } catch (error) {
        console.error("Error al eliminar el evento:", error);
        throw error;
    }
}



module.exports = {
    createEvent,
    listEvents,
    updateEvent,
    findEventsStartingInOneHour,
    deleteEventByDateAndId
}