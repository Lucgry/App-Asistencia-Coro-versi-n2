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
  lat: -24.786465581637948, // Coordenada de latitud de la Fundación Salta
  lng: -65.40845963142719, // Coordenada de longitud de la Fundación Salta
  radiusMeters: 100, // Radio en metros alrededor de la Fundación Salta
};

// ** ¡TU URL DE GOOGLE APPS SCRIPT AQUÍ! **
const GOOGLE_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzqUQLauJqzWo6rZPEkYLpKWLWA_0EFjPAUljTPmL4aSZdk7VtBTsyP5sbfDfUcVqPG/exec'; // Asegúrate de que esta URL sea la CORRECTA y ACTUALIZADA de tu despliegue

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
    setTimeout(clearMessage, 5000); // Borra el mensaje de éxito después de 5 segundos
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

// Función para determinar si es "tarde" según el criterio de Google Apps Script
function isLateAccordingToBackend(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  // El backend considera tarde si la hora es > 21 o (hora === 21 y minuto >= 16)
  return hour > 21 || (hour === 21 && minute >= 16);
}

// Proceso de registro (versión con geolocalización original, SIN async/await en el listener principal)
form.addEventListener("submit", (e) => { // <<< ¡OJO! Aquí NO está el "async"
  e.preventDefault();
  clearMessage();
  submitButton.disabled = true;

  const selectedName = select.value;
  if (!selectedName) {
    showMessage("Por favor, seleccioná tu nombre.", true);
    submitButton.disabled = false;
    return;
  }

  const now = new Date();

  // VALIDACIÓN 1: Horario permitido
  if (!isWithinSchedule(now)) {
    showMessage("El registro sólo está permitido los lunes, miércoles y viernes de 20:30 a 23:00.", true);
    submitButton.disabled = false;
    return;
  }

  // VALIDACIÓN 2: Ya registró asistencia hoy (basado en localStorage)
  if (hasAttendance(selectedName, formatDate(now))) {
    showMessage("Ya registraste tu asistencia hoy.", true);
    submitButton.disabled = false;
    return;
  }

  // VALIDACIÓN 3: Soporte de Geolocalización (Implementación original, no asíncrona en el submit)
  if (!navigator.geolocation) {
    showMessage("Geolocalización no soportada por el navegador. Usá un navegador compatible.", true);
    submitButton.disabled = false; // Habilitar el botón
    return;
  }

  // Si pasa las validaciones anteriores, intenta obtener la ubicación
  showMessage("Obteniendo ubicación..."); // Mensaje para el usuario

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Éxito al obtener la ubicación
      const locCheck = validateLocation(position);
      if (!locCheck.valid) {
        showMessage(`Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`, true);
        submitButton.disabled = false; // Habilitar el botón
        return; // Detiene la ejecución aquí dentro del callback
      }

      // Si la ubicación es válida, procede a registrar en Google Sheets
      showMessage("Registrando asistencia... por favor espera.");

      // Enviar datos al Google Apps Script
      fetch(`${GOOGLE_SCRIPT_WEB_APP_URL}?name=${encodeURIComponent(selectedName)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(result => {
          if (result.status === "success") {
            const attendanceDate = formatDate(now);
            const isLate = isLateAccordingToBackend(now); // Lógica del backend para tarde/a tiempo

            // Guardar en localStorage solo si el backend confirmó el éxito.
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
            form.reset(); // Limpiar formulario si el registro fue exitoso
          } else {
            showMessage(`Error al registrar: ${result.message}`, true);
          }
        })
        .catch(error => {
          console.error("Error al enviar al script de Google:", error);
          showMessage(`Ocurrió un error al enviar el registro: ${error.message || 'Error desconocido'}`, true);
        })
        .finally(() => {
          submitButton.disabled = false; // Habilitar el botón al finalizar la solicitud
        });
    },
    (error) => {
      // Error al obtener la ubicación
      console.error("Error de geolocalización:", error);
      submitButton.disabled = false; // Habilitar el botón
      if (error.code === error.PERMISSION_DENIED) {
        showMessage("Permiso de geolocalización denegado. Por favor, permití el acceso a la ubicación para registrar tu asistencia.", true);
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        showMessage("Ubicación no disponible. Asegurate de tener el GPS activado y buena señal.", true);
      } else if (error.code === error.TIMEOUT) {
        showMessage("Tiempo de espera agotado para obtener la ubicación. Intentá de nuevo.", true);
      } else {
        showMessage(`Ocurrió un error al obtener la ubicación. (${error.message || 'Error desconocido'})`, true);
      }
    },
    { // Opciones de geolocalización
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
});

// Inicialización
loadMembers();
updateClock();
setInterval(updateClock, 1000);
