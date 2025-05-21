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
  lat: -24.7866,
  lng: -65.4107,
  radiusMeters: 85,
};

// ** ¡TU URL DE GOOGLE APPS SCRIPT AQUÍ! **
const GOOGLE_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzqUQLauJqzWo6rZPEkYLpKWLWA_0EFjPAUljTPmL4aSZdk7VtBTsyP5sbfDfUcVqPG/exec'; //

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

  const isValidDay = day === 1 || day === 3 || day === 5; // Lunes, Miércoles, Viernes
  if (!isValidDay) return false;

  const timeInMinutes = hour * 60 + minute;
  const startTime = 20 * 60 + 30; // 20:30
  const endTime = 23 * 60 + 0; // 23:00

  return timeInMinutes >= startTime && timeInMinutes <= endTime;
}

// Calcular distancia en metros entre dos coordenadas (Haversine)
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // metros
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // en metros
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

// Guardar asistencia en localStorage
function saveAttendance(name, date, isLate) {
  const key = `asistencia_${name}_${date}`;
  localStorage.setItem(key, JSON.stringify({ name, date, isLate }));
}

// Verificar si ya registró asistencia hoy
function hasAttendance(name, date) {
  const key = `asistencia_${name}_${date}`;
  return localStorage.getItem(key) !== null;
}

// Contar llegadas tarde en el mes actual
function countLateArrivals(name, yearMonth) {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("asistencia_" + name)) {
      const record = JSON.parse(localStorage.getItem(key));
      if (record.isLate) {
        // comparar año y mes (formato AAAA-MM)
        if (record.date.startsWith(yearMonth)) count++;
      }
    }
  }
  return count;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#ff6666" : "#66ff66";
  if ("vibrate" in navigator) {
    navigator.vibrate(100);
  }
  // Después de mostrar el mensaje, lo borramos tras un tiempo si no es un error persistente
  if (!isError) {
    setTimeout(clearMessage, 5000); // Borra el mensaje de éxito después de 5 segundos
  }
}

function clearMessage() {
  message.textContent = "";
}

// Convertir fecha a AAAA-MM-DD
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatYearMonth(date) {
  return date.toISOString().slice(0, 7);
}

// Función para determinar si es "tarde" según el criterio de Google Apps Script
function isLateAccordingToBackend(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  // El backend considera tarde si la hora es > 21 o (hora === 21 y minuto >= 16)
  return hour > 21 || (hour === 21 && minute >= 16);
}

// Proceso de registro
form.addEventListener("submit", async (e) => { // Marcamos la función como 'async'
  e.preventDefault();
  clearMessage();
  submitButton.disabled = true; // Deshabilitamos el botón para evitar envíos múltiples

  const selectedName = select.value;
  if (!selectedName) {
    showMessage("Por favor, seleccioná tu nombre.", true);
    submitButton.disabled = false; // Habilitamos el botón
    return;
  }

  const now = new Date();

  // COMENTADO PARA PRUEBAS: Deshabilita la validación de horario
  /*
  if (!isWithinSchedule(now)) {
    showMessage("El registro sólo está permitido los lunes, miércoles y viernes de 20:30 a 23:00.", true);
    submitButton.disabled = false;
    return;
  }
  */

  // COMENTADO PARA PRUEBAS: Deshabilita la validación de si ya registró hoy en localStorage
  /*
  if (hasAttendance(selectedName, formatDate(now))) {
      showMessage("Ya registraste tu asistencia hoy.", true);
      submitButton.disabled = false;
      return;
  }
  */

  // COMENTADO PARA PRUEBAS: Deshabilita la validación de geolocalización
  /*
  if (!navigator.geolocation) {
    showMessage("Geolocalización no soportada por el navegador. Usá un navegador compatible.", true);
    submitButton.disabled = false;
    return;
  }
  */

  try {
    // COMENTADO PARA PRUEBAS: Saltea la obtención y validación de la geolocalización
    /*
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos para obtener la ubicación
        maximumAge: 0 // No usar caché de ubicación
      });
    });

    const locCheck = validateLocation(position);
    if (!locCheck.valid) {
      showMessage(`Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`, true);
      submitButton.disabled = false;
      return;
    }
    */
    // FIN DE COMENTARIOS PARA PRUEBAS DE GEOLOCALIZACIÓN

    // Si pasamos todas las validaciones locales (o si están comentadas), intentamos enviar a Google Sheets
    showMessage("Registrando asistencia... por favor espera."); // Mensaje de "cargando"

    const response = await fetch(`${GOOGLE_SCRIPT_WEB_APP_URL}?name=${encodeURIComponent(selectedName)}`); //

    if (!response.ok) {
      // Manejar errores de red o HTTP (ej. 404, 500)
      throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`); //
    }

    const result = await response.json(); // Parseamos la respuesta JSON del script de Google

    if (result.status === "success") { //
      // Si Google Apps Script confirmó el registro:
      const attendanceDate = formatDate(now);
      const isLate = isLateAccordingToBackend(now); // Usamos la lógica del backend para el mensaje

      // Guardamos en localStorage solo si el backend confirmó el éxito.
      // Si habías comentado hasAttendance, esto hará que cada vez que registres
      // se sobrescriba el último registro para ese día en localStorage.
      saveAttendance(selectedName, attendanceDate, isLate);

      const yearMonth = formatYearMonth(now);
      const lateCount = countLateArrivals(selectedName, yearMonth);

      let successMessage = "¡Asistencia registrada correctamente!";
      if (isLate) {
        successMessage += ` Llegaste tarde. Total llegadas tarde en este mes: ${lateCount}.`;
      } else {
        successMessage += " ¡A tiempo!";
      }
      showMessage(successMessage);
      form.reset(); // Limpiamos el formulario solo si el registro fue exitoso
    } else {
      // Si Google Apps Script devolvió un error (ej. "No se recibió el nombre" o tu script lo maneja)
      showMessage(`Error al registrar: ${result.message}`, true);
    }
  } catch (error) {
    // Capturamos cualquier error en el proceso (red, JSON, geolocalización, etc.)
    console.error("Error en el registro:", error);
    showMessage(`Ocurrió un error inesperado. Intentá de nuevo. (${error.message || 'Error desconocido'})`, true);
  } finally {
    submitButton.disabled = false; // Siempre habilitamos el botón al finalizar el proceso
  }
});

// Inicialización
loadMembers();
updateClock();
setInterval(updateClock, 1000);
