// Proceso de registro (con geolocalización TEMPORALMENTE DESACTIVADA para pruebas)
form.addEventListener("submit", async (e) => { // Asegúrate que aquí diga 'async'
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

  // --- INICIO DEL BLOQUE DE GEOLOCALIZACIÓN COMENTADO ---
  /*
  // VALIDACIÓN 3: Soporte de Geolocalización
  if (!navigator.geolocation) {
    showMessage("Geolocalización no soportada por el navegador. Usá un navegador compatible.", true);
    submitButton.disabled = false;
    return;
  }

  try {
    // Obtención y validación de la geolocalización
    showMessage("Obteniendo ubicación...");

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    const locCheck = validateLocation(position);
    if (!locCheck.valid) {
      showMessage(`Estás fuera de la ubicación permitida. Distancia: ${locCheck.distance} metros.`, true);
      submitButton.disabled = false;
      return;
    }
  } catch (error) {
    console.error("Error en geolocalización:", error);
    if (error.code === error.PERMISSION_DENIED) {
      showMessage("Permiso de geolocalización denegado. Por favor, permití el acceso a la ubicación para registrar tu asistencia.", true);
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      showMessage("Ubicación no disponible. Asegurate de tener el GPS activado y buena señal.", true);
    } else if (error.code === error.TIMEOUT) {
      showMessage("Tiempo de espera agotado para obtener la ubicación. Intentá de nuevo.", true);
    } else {
      showMessage(`Ocurrió un error inesperado al obtener la ubicación. (${error.message || 'Error desconocido'})`, true);
    }
    submitButton.disabled = false; // Habilitar el botón si hay error en geolocalización
    return; // Detener el flujo si la geolocalización falla
  }
  */
  // --- FIN DEL BLOQUE DE GEOLOCALIZACIÓN COMENTADO ---


  // A partir de aquí, el código procederá directamente al registro si las validaciones anteriores pasan
  showMessage("Registrando asistencia... por favor espera.");

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_WEB_APP_URL}?name=${encodeURIComponent(selectedName)}`);

    if (!response.ok) {
      throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.status === "success") {
      const attendanceDate = formatDate(now);
      const isLate = isLateAccordingToBackend(now);

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
      form.reset();
    } else {
      showMessage(`Error al registrar: ${result.message}`, true);
    }
  } catch (error) {
    console.error("Error al enviar al script de Google:", error);
    showMessage(`Ocurrió un error al enviar el registro: ${error.message || 'Error desconocido'}`, true);
  } finally {
    submitButton.disabled = false;
  }
});
