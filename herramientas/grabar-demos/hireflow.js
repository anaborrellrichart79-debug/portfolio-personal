const { grabar } = require("./grabador");
const { execFileSync } = require("child_process");
const ffmpeg = require("ffmpeg-static");
const path = require("path");

// Deja el video directamente donde lo usa la web.
const SALIDA = path.join(__dirname, "..", "..", "assets", "projects");
const URL = "http://localhost:3000";
const CLAVE = "demo2026";

// Espera a que la pantalla cargue sin que la espera salga en el video.
async function cargar(u, accion, selector) {
  await accion();
  u.pausar();
  await u.page.locator(selector).first().waitFor({ timeout: 20000 });
  await u.page.waitForLoadState("networkidle").catch(() => {});
  await u.page.waitForTimeout(300);
  u.seguir();
}

async function entrar(u, email) {
  const { page } = u;
  await u.clic("input[type=email]", { despues: 150 });
  await u.escribir(email, 35);
  await u.clic("input[type=password]", { despues: 150 });
  await u.escribir(CLAVE, 60);
  await cargar(u, () => u.clic("button[type=submit]", { despues: 0 }), "text=Accesos rápidos");
}

async function menu(u, ruta, selector) {
  await u.clic(".burger", { despues: 500 });
  await cargar(u, () => u.clic(`#nav-drawer a[href="#${ruta}"]`, { despues: 0 }), selector);
}

// Tarjeta: el div mas cercano al titulo que contiene botones. No depende
// del texto de los botones, que cambia al pulsarlos.
const tarjeta = (page, texto) => page.getByText(texto, { exact: true }).locator("xpath=ancestor::div[.//button][1]");

(async () => {
  // Datos limpios antes de cada toma
  execFileSync(process.execPath, [path.join(__dirname, "hireflow-datos.js")], { stdio: "inherit" });

  const mp4 = await grabar("hireflow-demo", SALIDA, async u => {
    const { page } = u;

    u.empezar();
    await u.tarjeta(`<small>PROYECTO FULL STACK</small><h1>HireFlow</h1>
      <p>Tu búsqueda de empleo y la de la empresa, en un solo panel</p>
      <div class=t><span>Node.js + Express</span><span>MySQL</span><span>JWT y roles</span><span>JavaScript</span><span>4 idiomas</span></div>`, 2600);

    // Candidata: acceso y panel
    await cargar(u, () => page.goto(URL + "/#/login"), "input[type=email]");
    await u.espera(400);
    await entrar(u, "lucia.navarro@correo.es");
    await u.mover(page.getByText("Próxima entrevista"), { pausa: 900 });

    // Postularse a una oferta, con consentimiento y firma
    await cargar(u, () => u.clic(page.getByText("Ofertas", { exact: true }).first(), { despues: 0 }), "text=Postularme");
    const oferta = tarjeta(page, "Desarrolladora Frontend");
    await u.mover(oferta.getByText("Desarrolladora Frontend", { exact: true }), { pausa: 700 });
    await u.clic(oferta.getByRole("button", { name: "Postularme" }), { despues: 700 });
    await u.clic(page.locator("dialog[open] input[type=checkbox]"), { despues: 400 });
    await u.clic(page.locator("dialog[open] input[type=text]"), { despues: 150 });
    await u.escribir("Lucía Navarro", 60);
    await u.espera(300);
    await u.clic(page.getByRole("button", { name: "Confirmar postulación" }), { despues: 1300 });

    // Estado de las postulaciones y calendario de entrevistas
    await menu(u, "/applications", "text=Desarrolladora Frontend");
    await u.mover(page.getByText("¡Actualizado por la empresa!").first(), { pausa: 1000 });
    await menu(u, "/calendar", "text=Videollamada");
    await u.mover(page.getByText("Videollamada").first(), { pausa: 1300 });

    // Asistente IA
    await menu(u, "/ai", "input[placeholder]");
    await u.clic(page.getByRole("button", { name: "¿Qué me preguntarán en la entrevista?" }), { despues: 400 });
    await page.keyboard.press("Enter");
    await u.espera(3200);

    // Cambio de idioma en vivo
    await u.mover("#lang-switcher", { pausa: 200 });
    await page.selectOption("#lang-switcher", "en");
    await u.espera(1400);
    await page.selectOption("#lang-switcher", "es");
    await u.espera(500);

    // Empresa: ve la postulacion nueva, cambia el estado y agenda la entrevista
    await u.clic(".burger", { despues: 500 });
    await cargar(u, () => u.clic("#nav-drawer .drawer-logout", { despues: 0 }), "input[type=email]");
    await entrar(u, "marta@nexadigital.es");
    await menu(u, "/applicants", "text=Ver perfil");
    const postulante = tarjeta(page, "Oferta: Desarrolladora Frontend");
    await u.mover(postulante.getByText("Oferta: Desarrolladora Frontend", { exact: true }), { pausa: 600 });
    await u.clic(postulante.getByRole("button", { name: "Ver perfil" }), { despues: 1300 });
    await u.clic(postulante.locator("select"), { despues: 150 });
    await postulante.locator("select").selectOption("interview");
    await u.espera(900);
    await u.clic(postulante.getByRole("button", { name: "Añadir entrevista" }), { despues: 600 });
    const dia = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
    await u.clic(page.locator("dialog[open] input[type=datetime-local]"), { despues: 150 });
    await page.locator("dialog[open] input[type=datetime-local]").fill(dia + "T11:00");
    await u.clic(page.locator("dialog[open] input[type=text]"), { despues: 150 });
    await u.escribir("Oficina de Nexa Digital, Valencia", 35);
    await u.clic(page.getByRole("button", { name: "Programar entrevista" }), { despues: 1500 });

    await u.tarjeta(`<small>NODE.JS · EXPRESS · MYSQL</small><h1>HireFlow</h1>
      <p>Código en github.com/anaborrellrichart79-debug/hireflow</p>`, 2600);
  });

  // Portada: un fotograma de la pantalla de titulo.
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-ss", "1.5", "-i", mp4, "-frames:v", "1", "-q:v", "4",
    path.join(SALIDA, "hireflow-demo-poster.jpg")]);
})().catch(e => { console.error(e); process.exit(1); });
