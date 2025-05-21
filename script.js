const form = document.getElementById("form");
const select = document.getElementById("names");
const message = document.getElementById("message");

const allowedDistanceMeters = 500; // Se puede ajustar o quitar para pruebas

// Función para mostrar mensajes al usuario
function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "salmon" : "lightgreen";
}

// Limpia mensajes previos
function clearMessage() {
  message.textContent = "";
}

// Formato de fecha dd-mm-yyyy
function formatDate(date) {
  return date.toLocaleDateString("es-AR");
}

// Validar ubicación (puedes comentar o quitar esta función para pruebas sin restricción)
function validateLocation(position) {
  // Coordenadas base (ejemplo)
  const baseLat = -24.7856;
  const baseLng = -65.4123;

  function toRad(x) {
    return (x * Math.PI) / 180;
  }

  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // metros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const dist = distance(
    baseLat,
    baseLng,
    position.coords.latitude,
    position.coords.longitude
  );

  return { valid: dist <= allowedDistanceMeters, distance: Math.round(dist) };
}

// LocalStorage para evitar múltiples registros el mismo día
function hasAttendance(name, date) {
  const key = `${name}_${date}`;
  return localStorage.getItem(key) === "true";
}

function saveAttendance(name, date, isLate) {
  const key = `${name}_${date}`;
  localStorage.setItem(key, "true");
}

// Evento submit del formulario
form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearMessage();

  const selectedName = select.value;
  if (!selectedName) {
    showMessage("Por favor, seleccioná tu nombre.", true);
    return;
  }

  const now = new Date();

  if (hasAttendance(selectedName, formatDate(now))) {
    showMessage("Ya registraste tu asistencia hoy.", true);
    return;
  }

  if (!navigator.geolocation) {
    showMessage("Geolocalización no soportada por el navegador.", true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Para pruebas sin restricción, comentar esta validación:
      // const locCheck = validateLocation(position);
      // if (!locCheck.valid) {
      //   showMessage(`Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`, true);
      //   return;
      // }

      // Enviar datos a Google Apps Script
      fetch(
        "https://script.google.com/macros/s/AKfycbzqUQLauJqzWo6rZPEkYLpKWLWA_0EFjPAUljTPmL4aSZdk7VtBTsyP5sbfDfUcVqPG/exec",
        {
          method: "POST",
          body: JSON.stringify({ name: selectedName }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            saveAttendance(selectedName, formatDate(now), false);
            showMessage(data.message);
            form.reset();
          } else {
            showMessage("Error al registrar asistencia: " + data.message, true);
          }
        })
        .catch(() => {
          showMessage("Error de conexión con el servidor.", true);
        });
    },
    (error) => {
      showMessage(
        "No se pudo obtener la ubicación. A
