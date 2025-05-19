# 📋 Registro de Asistencia - Coro de Cámara de Salta

Aplicación web diseñada para que los integrantes del coro registren su asistencia escaneando un código QR. Rápida, segura y funcional desde el celular.

---

## ✨ Funcionalidades principales

- ✅ **Registro único por ensayo:** cada cantante solo puede registrarse una vez por día.
- 📍 **Validación de ubicación:** se debe estar dentro de un radio de 85 metros de la sede del ensayo.
- 🕒 **Horario válido:** solo se puede registrar entre las 20:30 y las 23:00, los días **lunes, miércoles y viernes**.
- 🚨 **Detección de llegadas tarde:** registros después de las 23:15 se marcan como "Tarde".
- 📊 **Estadísticas personales:** la app muestra cuántas veces llegaste tarde en el mes actual.
- 🔔 **Feedback visual + vibración** para confirmación, advertencia o error.
- 📅 **Selección de nombres por cuerda** (Sopranos, Contraltos, Tenores, Bajos).
- 📤 **Envía datos a una hoja de Google Sheets** vía Google Apps Script.

---

## 🎨 Diseño y experiencia

- 🖼️ Encabezado con el logo del coro y fondo azul intenso.
- 🕘 Reloj digital en vivo, centrado sobre el formulario.
- 🌘 Modo oscuro con fuente Raleway y diseño responsive.
- 📱 Optimizada para móviles (tamaño máximo 480px).

---

## 🚀 Tecnologías utilizadas

- **HTML, CSS, JavaScript**
- **Google Fonts (Raleway)**
- **Geolocation API**
- **Google Apps Script (como backend)**

---

## 📍 Validación de ubicación

La app permite registrar asistencia únicamente si estás cerca del lugar de ensayo:

