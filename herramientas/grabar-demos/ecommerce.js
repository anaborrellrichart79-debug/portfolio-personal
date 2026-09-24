const { grabar, servidorEstatico } = require("./grabador");
const path = require("path");
const ffmpeg = require("ffmpeg-static");
const { execFileSync } = require("child_process");

// Deja el video directamente donde lo usa la web.
const SALIDA = path.join(__dirname, "..", "..", "assets", "projects");
const URL = "http://localhost:5500";

// Espera a que la pagina termine de cargar sin que la espera salga en el video.
async function cargar(u, accion, selector) {
  const { page } = u;
  await accion();
  u.pausar();
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  u.seguir();
}

(async () => {
  const srv = await servidorEstatico("E:\\ProyectosSeparados\\mini-ecommerce", 5500);
  try {
    const mp4 = await grabar("mini-ecommerce-demo", SALIDA, async u => {
      const { page } = u;

      u.empezar();
      await u.tarjeta(`<small>PROYECTO FULL STACK</small><h1>Mini e-commerce</h1>
        <p>Del catálogo al pago, con una API propia y Stripe</p>
        <div class=t><span>JavaScript ES Modules</span><span>Node.js + Express</span><span>Stripe</span><span>LocalStorage</span></div>`, 2600);

      await cargar(u, () => page.goto(URL + "/index.html"), ".product-card img");
      await u.espera(700);

      // Catalogo servido por la API + filtro por categoria
      await u.mover(".product-card:nth-child(2) h3", { pausa: 350 });
      await u.scroll(380, 30);
      await u.scroll(-380, 30);
      await u.clic("#categorias", { despues: 150 });
      await page.selectOption("#categorias", "balones");
      await u.espera(1300);
      await page.selectOption("#categorias", "todasLasCategorias");
      await u.espera(600);

      // Ficha de producto
      await cargar(u, () => u.clic(".product-card:nth-child(1) .btn-secondary", { despues: 0 }), "#add-to-cart-btn");
      await u.espera(500);
      await u.mover(".info-producto .price", { pausa: 500 });
      await u.clic("#add-to-cart-btn", { despues: 1200 });

      // Segundo producto desde el catalogo
      await cargar(u, () => u.clic("nav a[href='index.html']", { despues: 0 }), ".product-card img");
      await u.espera(300);
      await u.clic(".product-card:nth-child(3) .btn-add", { despues: 1200 });

      // Carrito persistido en localStorage
      await cargar(u, () => u.clic(".cart-link", { despues: 0 }), ".cart-item img");
      await u.espera(500);
      await u.mover("#total-carrito", { pausa: 700 });

      // Checkout: el total lo recalcula el servidor y Stripe monta el formulario
      const stripe = page.frameLocator("#payment-element iframe").first();
      const numero = stripe.locator("input[name='number']");
      await u.clic("#btn-caja", { despues: 0 });
      u.pausar();
      await numero.waitFor({ timeout: 30000 });
      await u.espera(600);
      u.seguir();
      await u.espera(500);
      await u.clic(numero, { despues: 150 });
      await u.escribir("4242424242424242", 40);
      await u.clic(stripe.locator("input[name='expiry']"), { despues: 100 });
      await u.escribir("1234", 70);
      await u.clic(stripe.locator("input[name='cvc']"), { despues: 100 });
      await u.escribir("123", 70);
      await u.espera(400);
      await u.clic("#submit-btn", { despues: 0 });
      u.pausar();
      await page.waitForURL(/pedido-confirmado/, { timeout: 45000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      u.seguir();
      await u.espera(2000);

      await u.tarjeta(`<small>MODO DE PRUEBA DE STRIPE · SIN COBROS REALES</small><h1>Mini e-commerce</h1>
        <p>Código en github.com/anaborrellrichart79-debug</p>`, 2600);
    });
    // Portada: un fotograma de la pantalla de titulo.
    execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-ss", "1.5", "-i", mp4, "-frames:v", "1", "-q:v", "4",
      path.join(SALIDA, "mini-ecommerce-demo-poster.jpg")]);
  } finally { srv.close(); }
})().catch(e => { console.error(e); process.exit(1); });
