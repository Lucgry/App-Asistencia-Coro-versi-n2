const form = document.getElementById("attendanceForm");
const select = document.getElementById("nameSelect");
const message = document.getElementById("message");

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

// LocalStorage para evitar múltiples registros el mismo día
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

  // Para pruebas sin restricción de geolocalización, omitimos esta validación
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
});
