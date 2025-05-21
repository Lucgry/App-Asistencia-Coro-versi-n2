// Reloj digital en vivo
function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  clock.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Enviar asistencia sin restricciones ni validaciones
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const select = document.getElementById('nameSelect');
  const nombre = select.value;
  const message = document.getElementById('message');

  if (!nombre) {
    message.textContent = 'Por favor, selecciona un nombre.';
    return;
  }

  message.textContent = 'Registrando...';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbysNaXt0k80VXfVyyimmkF6mPXqGnKDX1h9OxU76jsv420Pl7bxD04LONPe59BinsMc/exec', {
      method: 'POST',
      body: JSON.stringify({ name: nombre }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.status === 'success') {
      message.textContent = `Asistencia registrada: ${data.data.nombre} a las ${data.data.hora} (${data.data.estado})`;
    } else {
      message.textContent = 'Error al registrar asistencia: ' + data.message;
    }

  } catch (error) {
    message.textContent = 'Error de conexión: ' + error.message;
  }
});
