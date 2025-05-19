// Datos de integrantes por cuerda (ordenados alfabéticamente)
const choirMembers = {
  Sopranos: [
    "Aparicio Rocío", "Aramayo Valentina", "Evangelista Maira", "Ferri Mónica",
    "Gallardo Cintia", "Perez Gesualdo Anahi", "Romina Andrea", "Ruiz Paola",
    "Solís Lucero", "Suárez Daniela",
  ],
  Contraltos: [
    "Aguilera Abril", "Buchller Patricia", "Caro Zaira", "Cuello Sandra",
    "Galvez Delfina", "Salmoral Carolina",
  ],
  Tenores: [
    "Groppa Octavio", "Liendro Gabriel", "Otero Oscar", "Roldán Cristian",
    "Silva G. José", "Valdez Julio", "Velárdez José",
  ],
  Bajos: [
    "Colqui Marcelo", "Goytia Abel", "Ibarra Wally", "Jardín Augusto",
    "Rocha Ariel", "Villafañe Valentín",
  ],
};

const form = document.getElementById("attendance-form");
const select = document.getElementById("member-select");
const message = document.getElementById("message");
const clock = document.getElementById("clock");

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

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-AR", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  clock.textContent = timeStr;
}

function saveAttendance(name, date) {
  const key = `asistencia_${name}_${date}`;
  localStorage.setItem(key, "true");
}

function hasAttendance(name, date) {
  const key = `asistencia_${name}_${date}`;
  return localStorage.getItem(key) !== null;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#ff6666" : "#66ff66";
  if ("vibrate" in navigator) navigator.vibrate(100);
}

function clearMessage() {
  message.textContent = "";
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Registro sin restricciones
form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearMessage();

  const selectedName = select.value;
  if (!selectedName) {
    showMessage("Por favor, seleccioná tu nombre.", true);
    return;
  }

  const now = new Date();
  const dateStr = formatDate(now);

  if (hasAttendance(selectedName, dateStr)) {
    showMessage("Ya registraste tu asistencia hoy.", true);
    return;
  }

  showMessage("Registrando asistencia...", false);
  form.querySelector("button[type=submit]").disabled = true;

  saveAttendance(selectedName, dateStr);

  fetch("https://script.google.com/macros/s/AKfycbwsVQkwXwZtGf-oamQqDxJVlFZJTvoP3SqiXjwSBkId771JwvqM8Iw96qemQEGfVNIL/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: selectedName,
      fecha: now.toLocaleDateString("es-AR"),
      hora: now.toLocaleTimeString("es-AR", { hour12: false }),
      estado: "Presente",
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      form.querySelector("button[type=submit]").disabled = false;
      if (data.result === "OK") {
        showMessage("Registro guardado correctamente.");
        form.reset();
      } else {
        showMessage("Error en el registro: " + (data.error || "Desconocido"), true);
      }
    })
    .catch(() => {
      form.querySelector("button[type=submit]").disabled = false;
      showMessage("Error al conectar con el servidor.", true);
    });
});

// Iniciar
loadMembers();
setInterval(updateClock, 1000);
