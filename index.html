// Elementos del DOM según tu HTML
const form = document.getElementById("attendanceForm");
const select = document.getElementById("nameSelect");
const message = document.getElementById("message");

// Para pruebas, puedes comentar la validación de ubicación
const allowedDistanceMeters = 500; // Distancia máxima permitida en metros

// Mostrar mensaje al usuario
function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "salmon" : "lightgreen";
}

// Limpiar mensaje
function clearMessage() {
  message.textContent = "";
}

// Formato de fecha dd-mm-yyyy
function formatDate(date) {
  return date.toLocaleDateString("es-AR");
}

// Validar ubicación (comentar si no la usás)
function validateLocation(position) {
  const baseLat = -24.7856; // Cambiá por la latitud base real
  const baseLng = -65.4123; // Cambiá por la longitud base real

  function toRad(x) {
    return (x * Math.PI) / 180;
  }

  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio Tierra en metros
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

// Evitar múltiples registros el mismo día con LocalStorage
function hasAttendance(name, date) {
  const key = `${name}_${date}`;
  return localStorage.getItem(key) === "true";
}

function saveAttendance(name, date) {
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
      // Para pruebas, podés comentar esta validación si querés:
      // const locCheck = validateLocation(position);
      // if (!locCheck.valid) {
      //   showMessage(`Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`, true);
      //   return;
      // }

      // Enviar datos al Google Apps Script
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
            saveAttendance(selectedName, formatDate(now));
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
      showMessage("No se pudo obtener la ubicación. Asegurate de permitirla.", true);
    }
  );
});
