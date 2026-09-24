# Grabar los vídeos de demo

Los proyectos que necesitan servidor (API, Stripe, base de datos) no pueden
publicarse en GitHub Pages, así que su demo en el portfolio es un vídeo. Estos
scripts lo graban solos: abren Chrome sin ventana, recorren la aplicación como
lo haría una persona (con un cursor dibujado) y generan un MP4 en
`assets/projects/`.

Así el vídeo se puede repetir idéntico cada vez que cambie la aplicación.

## Requisitos

- Google Chrome instalado en la ruta habitual.
- Node.js.
- La primera vez: `npm install` dentro de esta carpeta. No descarga ningún
  navegador: usa el Chrome que ya tienes.

## Mini e-commerce

1. Arranca la API: en `mini-ecommerce-api`, `node server.js` (puerto 3000).
   Necesita su `.env` con las claves **de prueba** de Stripe (`sk_test_...`).
2. Aquí: `npm run ecommerce`.

La tienda la sirve el propio script en el puerto 5500, así que no hace falta
arrancarla aparte. El pago usa la tarjeta de prueba 4242 4242 4242 4242: no se
cobra nada.

El script deja en `assets/projects/` el vídeo (`mini-ecommerce-demo.mp4`) y su
imagen de portada (`mini-ecommerce-demo-poster.jpg`).

## HireFlow

Se graba contra una base de datos aparte, `hireflow_demo`, con datos de ejemplo
realistas (Lucía Navarro, candidata; Marta Gil, reclutadora de Nexa Digital). La
base real de desarrollo, `hireflow`, no se toca.

**Solo la primera vez**, crea la base vacía. En PowerShell (pide la contraseña
de root de MySQL):

```
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "CREATE DATABASE IF NOT EXISTS hireflow_demo; GRANT ALL PRIVILEGES ON hireflow_demo.* TO 'hireflow_user'@'localhost';"
```

Las tablas no hace falta crearlas: la primera vez que se ejecuta,
`hireflow-datos.js` copia en `hireflow_demo` la estructura de `hireflow` y los
datos de las tablas de referencia (tipos de entrevista y contenido del
asistente IA). De `hireflow` solo lee.

**Para grabar:**

1. Arranca HireFlow contra la base de demo, en PowerShell:
   ```
   cd E:\hireflow\backend
   $env:DB_NAME = "hireflow_demo"; node server.js
   ```
2. Aquí: `npm run hireflow`.

El script vacía `hireflow_demo` y la vuelve a rellenar antes de cada toma
(`hireflow-datos.js`), porque la propia grabación crea una postulación y una
entrevista. Solo puede vaciar `hireflow_demo`: si se conecta a otra base, se
para. Para entrar a mano en la demo, la contraseña de todos los usuarios es
`demo2026`.

Deja en `assets/projects/` `hireflow-demo.mp4` y `hireflow-demo-poster.jpg`.

## Cómo funciona

- `grabador.js` es la parte común: lanza Chrome, dibuja el cursor, captura la
  pantalla con el *screencast* de Chrome y monta el MP4 con ffmpeg (H.264,
  1280x720, sin sonido).
- Cada proyecto tiene su guion (`ecommerce.js`): una lista de pasos del tipo
  "mover el ratón aquí, hacer clic, escribir esto".
- `u.pausar()` y `u.seguir()` cortan del vídeo las esperas de carga, para que
  no salgan segundos de pantalla en blanco.
- `u.tarjeta()` muestra una pantalla de título, que se usa al principio y al
  final del vídeo.
