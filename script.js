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

const form = document.getElementById("attendance-form");
const select = document.getElementById("member-select");
const message = document.getElementById("message");
const clock = document.getElementById("clock");

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
        // comparar año y mes (formato YYYY-MM)
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
}

function clearMessage() {
  message.textContent = "";
}

// Convertir fecha a YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatYearMonth(date) {
  return date.toISOString().slice(0, 7);
}

// Proceso de registro
form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearMessage();

  const selectedName = select.value;
  if (!selectedName) {
    showMessage("Por favor, seleccioná tu nombre.", true);
    return;
  }

  const now = new Date();

  if (!isWithinSchedule(now)) {
    showMessage(
      "El registro sólo está permitido los lunes, miércoles y viernes de 20:30 a 23:00.",
      true
    );
    //return;
  }

  if (hasAttendance(selectedName, formatDate(now))) {
    showMessage("Ya registraste tu asistencia hoy.", true);
    return;
  }

  if (!navigator.geolocation) {
    showMessage("Geolocalización no soportada por el navegador.", true);
    return;
  }

  showMessage("Registrando asistencia...", false);
  form.querySelector("button[type=submit]").disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const locCheck = validateLocation(position);
      if (!locCheck.valid) {
        form.querySelector("button[type=submit]").disabled = false;
        showMessage(
          `Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`,
          true
        );
        return;
      }

      const lateLimit = new Date(now);
      lateLimit.setHours(23, 15, 0, 0);
      const isLate = now > lateLimit;

      // Guardar en localStorage
      saveAttendance(selectedName, formatDate(now), isLate);

      const yearMonth = formatYearMonth(now);
      const lateCount = countLateArrivals(selectedName, yearMonth);

      // Enviar datos a Google Sheets (tu URL acá)
      fetch(
        "https://script.google.com/macros/s/AKfycbwsVQkwXwZtGf-oamQqDxJVlFZJTvoP3SqiXjwSBkId771JwvqM8Iw96qemQEGfVNIL/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: selectedName,
            fecha: now.toLocaleDateString("es-AR"),
            hora: now.toLocaleTimeString("es-AR", { hour12: false }),
            estado: isLate ? "Tarde" : "Presente",
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          form.querySelector("button[type=submit]").disabled = false;
          if (data.result === "OK") {
            showMessage(
              isLate
                ? `Registro guardado. Llegás tarde. Total llegadas tarde en este mes: ${lateCount}.`
                : "Registro guardado. ¡A tiempo!"
            );
            form.reset();
          } else {
            showMessage("Error en registro: " + (data.error || "Desconocido"), true);
          }
        })
        .catch(() => {
          form.querySelector("button[type=submit]").disabled = false;
          showMessage("Error conectando con el servidor.", true);
        });
    },
    (error) => {
      form.querySelector("button[type=submit]").disabled = false;
      showMessage(
        "No se pudo obtener la ubicación. Asegurate de permitir el acceso.",
        true
      );
    }
  );
});

// Inicialización
loadMembers();
updateClock();
setInterval(updateClock, 1000);
