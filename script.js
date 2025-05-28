// Datos de integrantes por cuerda (ordenados alfabéticamente)
const choirMembers = {
  Sopranos: [
    "Aparicio Rocío",
    "Aramayo Valentina",
    "Evangelista Maira",
    "Ferri Mónica",
    "Gallardo Cintia",
    "Perez Gesualdo Anahi",
    "Romina Andrea",
    "Ruiz Paola",
    "Solís Lucero",
    "Suárez Daniela",
  ],
  Contraltos: [
    "Aguilera Abril",
    "Buchller Patricia",
    "Caro Zaira",
    "Cuello Sandra",
    "Galvez Delfina",
    "Salmoral Carolina",
  ],
  Tenores: [
    "Groppa Octavio",
    "Liendro Gabriel",
    "Otero Oscar",
    "Roldán Cristian",
    "Silva G. José",
    "Valdez Julio",
    "Velárdez José",
  ],
  Bajos: [
    "Colqui Marcelo",
    "Goytia Abel",
    "Ibarra Wally",
    "Jardín Augusto",
    "Rocha Ariel",
    "Villafañe Valentín",
  ],
};

const locationAllowed = {
  lat: -24.7864326, // Coordenada de la sala de ensayos
  lng: -65.4084228, // Coordenada de la sala de ensayos
  radiusMeters: 3000, // Radio en metros alrededor de tu casa (ajustable)
};

// ** ¡TU URL DE GOOGLE APPS SCRIPT AQUÍ! **
// Asegúrate de que esta URL sea la CORRECTA y ACTUALIZADA de tu despliegue
// Esta URL ha sido actualizada con la que proporcionaste.
const GOOGLE_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwW-Svoy-NtQSpPZQXIam6HjA3A7UCS44LhvI7DXnkE-2wTtb7e3_JB8jJHZBcrMeoz/exec';

const form = document.getElementById("attendance-form");
const select = document.getElementById("member-select");
const message = document.getElementById("message");
const clock = document.getElementById("clock");
const submitButton = form.querySelector('button[type="submit"]'); // Para deshabilitar el botón

// Función para cargar los miembros en el select
function loadMembers() {
  for (const cuerda in choirMembers) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = cuerda;
    choirMembers[cuerda].forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  }
}

// Función para actualizar el reloj cada segundo
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-AR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  clock.textContent = timeStr;
}

// Validar si fecha y hora están dentro del horario permitido
function isWithinSchedule(date) {
  const day = date.getDay(); // 0 = Domingo, 1 = Lunes ...
  const hour = date.getHours();
  const minute = date.getMinutes();

  // Horario permitido: Lunes, Miércoles, Viernes de 20:30 a 23:00
  const isValidDay = day === 1 || day === 3 || day === 5;
  if (!isValidDay) return false;

  const timeInMinutes = hour * 60 + minute;
  const startTime = 20 * 60 + 30; // 20:30
  const endTime = 23 * 60 + 0; // 23:00

  return timeInMinutes >= startTime && timeInMinutes <= endTime;
}

// Calcular distancia en metros entre dos coordenadas (Haversine)
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

// Validar ubicación con geolocalización
function validateLocation(position) {
  const { latitude, longitude } = position.coords;
  const distance = getDistanceMeters(
    latitude,
    longitude,
    locationAllowed.lat,
    locationAllowed.lng
  );
  return distance <= locationAllowed.radiusMeters
    ? { valid: true }
    : { valid: false, distance: distance.toFixed(1) };
}

// Guardar asistencia en localStorage para control local
function saveAttendance(name, date, isLate) {
  const key = `asistencia_${name}_${date}`;
  localStorage.setItem(key, JSON.stringify({ name, date, isLate }));
}

// Verificar si ya registró asistencia hoy en localStorage
function hasAttendance(name, date) {
  const key = `asistencia_${name}_${date}`;
  return localStorage.getItem(key) !== null;
}

// Contar llegadas tarde en el mes actual desde localStorage
function countLateArrivals(name, yearMonth) {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("asistencia_" + name)) {
      try {
        const record = JSON.parse(localStorage.getItem(key));
        if (record && record.isLate) {
          if (record.date && record.date.startsWith(yearMonth)) count++;
        }
      } catch (e) {
        console.error("Error parseando item de localStorage:", key, e);
      }
    }
  }
  return count;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#ff6666" : "#66ff66";
  if ("vibrate" in navigator) {
    navigator.vibrate(100); // Vibrar el dispositivo en móvil
  }
  if (!isError) {
    // CAMBIO A 15 SEGUNDOS: 15000 milisegundos
    setTimeout(clearMessage, 15000); // Borra el mensaje de éxito después de 15 segundos
  }
}

function clearMessage() {
  message.textContent = "";
}

// Convertir fecha a AAAA-MM-DD (ej: 2025-05-22)
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Convertir fecha a AAAA-MM (ej: 2025-05)
function formatYearMonth(date) {
  return date.toISOString().slice(0, 7);
}

// Función para determinar si es "tarde" según el criterio de Google Apps Script (21:16)
function isLateAccordingToAppsScriptLogic(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  // Se considera tarde si la hora es > 21 o (hora === 21 y minuto >= 16)
  return hour > 21 || (hour === 21 && minute >= 16);
}


// Proceso de registro (con geolocalización estructurada con async/await y sin enviar status)
form.addEventListener("submit", async (e) => { // <<< ¡CLAVE! "async" aquí
  e.preventDefault();
  clearMessage();
  submitButton.disabled = true; // Deshabilitamos el botón al inicio

  const selectedName = select.value;
  if (!selectedName) {
    showMessage("Por favor, seleccioná tu nombre.", true);
    submitButton.disabled = false; // Habilitar si hay error aquí
    return;
  }

  const now = new Date();

  // VALIDACIÓN 1: Horario permitido
  if (!isWithinSchedule(now)) {
    showMessage("El registro sólo está permitido los lunes, miércoles y viernes de 20:30 a 23:00.", true);
    submitButton.disabled = false; // Habilitar si hay error aquí
    return;
  }

  // VALIDACIÓN 2: Ya registró asistencia hoy (basado en localStorage)
  if (hasAttendance(selectedName, formatDate(now))) {
    showMessage("Ya registraste tu asistencia hoy.", true);
    submitButton.disabled = false; // Habilitar si hay error aquí
    return;
  }

  // VALIDACIÓN 3: Soporte de Geolocalización
  if (!navigator.geolocation) {
    showMessage("Geolocalización no soportada por el navegador. Usá un navegador compatible.", true);
    submitButton.disabled = false; // Habilitar si hay error aquí
    return;
  }

  try {
    // Obtención y validación de la geolocalización
    showMessage("Obteniendo ubicación..."); // Mensaje para el usuario

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,  // Intentar obtener la ubicación más precisa posible
        timeout: 10000,            // Tiempo máximo para obtener la ubicación (10 segundos)
        maximumAge: 0              // No usar caché de ubicación (obtener la ubicación actual)
      });
    });

    const locCheck = validateLocation(position);
    if (!locCheck.valid) {
      showMessage(`Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`, true);
      submitButton.disabled = false; // Habilitar si hay error aquí
      return; // Detiene la ejecución si la ubicación no es válida
    }

    // --- CÁLCULO DEL ESTADO "TARDE" PARA EL MENSAJE LOCAL Y localStorage ---
    const isLateForClientDisplay = isLateAccordingToAppsScriptLogic(now);

    // Si todas las validaciones locales pasan, intentamos enviar a Google Sheets
    showMessage("Registrando asistencia... por favor espera.");

    // --- ¡IMPORTANTE! NO ENVIAMOS EL PARÁMETRO 'status' AQUÍ.
    // El Apps Script lo calcula solo.
    const response = await fetch(`${GOOGLE_SCRIPT_WEB_APP_URL}?name=${encodeURIComponent(selectedName)}`);

    if (!response.ok) {
      throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
    }

    const result = await response.json(); // Parseamos la respuesta JSON del script de Google

    if (result.status === "success") {
      const attendanceDate = formatDate(now);
      // 'isLateForClientDisplay' ya está calculado

      saveAttendance(selectedName, attendanceDate, isLateForClientDisplay); // Guardar en localStorage

      const yearMonth = formatYearMonth(now);
      const lateCount = countLateArrivals(selectedName, yearMonth);

      let successMessage = "¡Asistencia registrada correctamente!";
      // Variable para controlar el color del mensaje
      let messageColorIsRed = false; // Por defecto el color es verde

      if (isLateForClientDisplay) { // Si es tarde, ajustamos el mensaje y el color
        successMessage += ` Llegaste tarde. Total llegadas tarde en este mes: ${lateCount}.`;
        messageColorIsRed = true; // Para que el mensaje sea rojo
      } else {
        successMessage += " ¡A tiempo!";
      }
      // Pasamos 'messageColorIsRed' para que showMessage sepa qué color usar
      showMessage(successMessage, messageColorIsRed);
      form.reset(); // Limpiar formulario si el registro fue exitoso
    } else {
      showMessage(`Error al registrar: ${result.message}`, true);
    }
  } catch (error) {
    // Capturamos cualquier error en el proceso (fallo de red, geolocalización, JSON)
    console.error("Error en el registro:", error);
    if (error.code === error.PERMISSION_DENIED) {
      showMessage("Permiso de geolocalización denegado. Por favor, permití el acceso a la ubicación para registrar tu asistencia.", true);
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      showMessage("Ubicación no disponible. Asegurate de tener el GPS activado y buena señal.", true);
    } else if (error.code === error.TIMEOUT) {
      showMessage("Tiempo de espera agotado para obtener la ubicación. Intentá de nuevo.", true);
    } else {
      showMessage(`Ocurrió un error inesperado. Intentá de nuevo. (${error.message || 'Error desconocido'})`, true);
    }
  } finally {
    submitButton.disabled = false; // Siempre habilitar el botón al finalizar el proceso
  }
});

// Inicialización
loadMembers();
updateClock();
setInterval(updateClock, 1000);
