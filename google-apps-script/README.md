# Conectar devoluciones con Google Sheets

## 1. Crear la planilla

Creá una Google Sheet nueva, por ejemplo:

**Relatos Binaurales – Devoluciones Semana de la Voz**

## 2. Abrir Apps Script

Dentro de la planilla:

**Extensiones → Apps Script**

Borrá el contenido inicial de `Code.gs` y pegá el contenido del archivo `google-apps-script/Code.gs` de este repositorio.

## 3. Ejecutar la configuración una vez

En el selector de funciones elegí `configurar` y presioná **Ejecutar**.

Google va a pedir autorización porque el script necesita escribir en tu propia planilla. Aceptala.

Esto crea automáticamente la hoja `Respuestas` y sus encabezados.

## 4. Publicar como aplicación web

En Apps Script:

**Implementar → Nueva implementación → Aplicación web**

Configuración recomendada:

- **Ejecutar como:** Yo
- **Quién tiene acceso:** Cualquiera

Presioná **Implementar** y copiá la URL que termina en `/exec`.

Al abrir esa URL en el navegador debería decir:

`OK · Relatos Binaurales CENT 11`

## 5. Conectar la URL a la web

La URL `/exec` se coloca en la constante `FEEDBACK_ENDPOINT` al comienzo de `feedback.js`.

Después de eso el formulario deja el modo borrador y las devoluciones se escriben en la Google Sheet.

## Datos guardados

Se crea una fila por cada relato reseñado, con:

- fecha de recepción;
- fecha enviada por la web;
- ID anónimo de sesión;
- relato;
- autor/a;
- aspectos destacados;
- valoración de inmersión de 1 a 5;
- comentario sobre el relato;
- indicación de favorito;
- comentario general de la experiencia.

No se solicita nombre ni correo del visitante.
