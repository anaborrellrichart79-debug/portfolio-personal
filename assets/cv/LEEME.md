# Material para el CV

Estos archivos no los usa la web. Están aquí para imprimirlos o pegarlos en el
currículum, que es donde un código QR se escanea de verdad: quien está viendo la
web ya tiene el enlace a un clic.

## Códigos QR

| Archivo | Para qué |
|---|---|
| `qr-github.svg` | Vectorial. La mejor opción si tu editor lo acepta: se ve nítido a cualquier tamaño, también impreso. |
| `qr-github.png` | 1024x1024 píxeles. Para Word, Google Docs, Canva y demás, que no suelen aceptar SVG. |

Ambos contienen la dirección `https://github.com/anaborrellrichart79-debug`
escrita dentro. Son **códigos QR estáticos**: no dependen de ningún servicio
externo, así que no pueden dejar de funcionar.

El QR anterior sí dejó de funcionar porque era **dinámico**: no guardaba la
dirección de GitHub, sino un enlace acortado del generador que redirigía a ella,
y ese servicio dejó de redirigir al acabar el periodo gratuito. Si algún día
necesitas otro, busca la opción "QR estático". Si el generador te ofrece
estadísticas de escaneos o cambiar el destino más tarde, es dinámico y acabará
caducando.

## Al imprimirlo

- No lo hagas más pequeño de unos 2 cm de lado, o las cámaras tendrán problemas.
- Deja el margen blanco que ya trae la imagen: forma parte del estándar y sin él
  muchos lectores no lo encuentran.
- No lo recortes ni le cambies los colores.

## Si cambia la dirección

Hay que generar el QR otra vez: la dirección va escrita dentro de la imagen y no
se puede editar. Se generó con la librería `qrcode-generator`, con nivel de
corrección de errores M y una zona silenciosa de 4 módulos.
