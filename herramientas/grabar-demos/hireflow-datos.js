// Rellena la base hireflow_demo con datos de ejemplo realistas para grabar
// la demo. Todo pasa por la API de HireFlow (no por SQL), asi que las
// contrasenas, los consentimientos y los permisos siguen las reglas reales.
//
// Requiere HireFlow arrancado contra la base de demo:
//   cd E:\hireflow\backend  ->  $env:DB_NAME = "hireflow_demo"; node server.js
// Si hireflow_demo esta vacia, primero copia en ella las tablas de hireflow.

const fs = require("fs");
const mysql = require("mysql2/promise");

const API = "http://localhost:3000/api";
const BASE_DEMO = "hireflow_demo";
const ENV_HIREFLOW = "E:/hireflow/backend/.env";
// Tablas que se vacian al reiniciar. Las de referencia (tipos de
// entrevista y contenido del asistente IA) se conservan.
const TABLAS_DATOS = ["application_notes", "interviews", "calendar_events", "applications",
  "contacts", "job_offers", "companies", "user_profiles", "users"];
const CLAVE = "demo2026";

async function llamar(ruta, { method = "GET", body, token } = {}) {
  const res = await fetch(API + ruta, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: "Bearer " + token }) },
    body: body && JSON.stringify(body),
  });
  const datos = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${ruta} -> ${res.status} ${JSON.stringify(datos)}`);
  return datos;
}

async function usuario(name, email, role, perfil) {
  await llamar("/users", { method: "POST", body: { name, email, password: CLAVE, role, termsAccepted: true } });
  const { token } = await llamar("/users/login", { method: "POST", body: { email, password: CLAVE } });
  if (perfil) await llamar("/users/me", { method: "PUT", token, body: perfil });
  return token;
}

// Fecha de esta semana (lunes = 0) a una hora dada, en formato de la API.
function estaSemana(dia, hora) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + dia);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${hora}:00`;
}

// Si hireflow_demo esta vacia, copia la estructura de la base real y los
// datos de las tablas de referencia. De la base real solo se lee.
async function crearTablas(demo, env) {
  const real = await mysql.createConnection({ host: env.DB_HOST, port: env.DB_PORT || 3306, user: env.DB_USER,
    password: env.DB_PASSWORD, database: env.DB_NAME });
  const [tablas] = await real.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  for (const fila of tablas) {
    const t = Object.values(fila)[0];
    const [[crear]] = await real.query("SHOW CREATE TABLE `" + t + "`");
    await demo.query(crear["Create Table"].replace(/ AUTO_INCREMENT=\d+/, ""));
    if (TABLAS_DATOS.includes(t)) continue;
    const [filas] = await real.query("SELECT * FROM `" + t + "`");
    if (!filas.length) continue;
    const cols = Object.keys(filas[0]);
    await demo.query("INSERT INTO `" + t + "` (`" + cols.join("`, `") + "`) VALUES ?", [filas.map(f => cols.map(c => f[c]))]);
  }
  await real.end();
  console.log("Tablas copiadas de " + env.DB_NAME + " a " + BASE_DEMO);
}

// Vacia las tablas de datos de hireflow_demo. Nunca toca otra base.
async function reiniciar() {
  const env = Object.fromEntries(fs.readFileSync(ENV_HIREFLOW, "utf8").split(/\r?\n/)
    .filter(l => l.includes("=") && !l.startsWith("#")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
  const c = await mysql.createConnection({ host: env.DB_HOST, port: env.DB_PORT || 3306, user: env.DB_USER,
    password: env.DB_PASSWORD, database: BASE_DEMO });
  const [[{ base }]] = await c.query("SELECT DATABASE() AS base");
  if (base !== BASE_DEMO) throw new Error("Conectado a " + base + ", no a " + BASE_DEMO);
  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  const [existentes] = await c.query("SHOW TABLES");
  if (!existentes.length) await crearTablas(c, env);
  for (const t of TABLAS_DATOS) await c.query("TRUNCATE TABLE `" + t + "`");
  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  await c.end();
}

(async () => {
  await reiniciar();
  const marta = await usuario("Marta Gil", "marta@nexadigital.es", "recruiter");
  const lucia = await usuario("Lucía Navarro", "lucia.navarro@correo.es", "candidate",
    { sector: "Desarrollo web", phone: "612 345 678", location: "Alicante", profile_visible: true });

  const empresas = {};
  for (const e of [
    { name: "Nexa Digital", email: "empleo@nexadigital.es", industry: "Consultoría tecnológica", location: "Valencia", description: "Producto digital para comercio y turismo." },
    { name: "Brisa Software", email: "talento@brisasoftware.es", industry: "SaaS", location: "Alicante", description: "Software de gestión para clínicas." },
    { name: "Lumen Labs", email: "jobs@lumenlabs.io", industry: "Startup", location: "Madrid", description: "Herramientas de aprendizaje online." },
    { name: "Atlas Retail", email: "rrhh@atlasretail.es", industry: "Comercio electrónico", location: "Barcelona", description: "Tienda online de deporte." },
  ]) empresas[e.name] = (await llamar("/companies", { method: "POST", token: marta, body: e })).id;

  const ofertas = {};
  for (const o of [
    ["Nexa Digital", "Desarrolladora Frontend", "Valencia (híbrido)", "permanent", "2200", "HTML, CSS, JavaScript, accesibilidad"],
    ["Brisa Software", "Full Stack Node.js", "Alicante", "full_time", "1900", "Node.js, Express, MySQL"],
    ["Lumen Labs", "Junior Web Developer", "Remoto", "permanent", "1900", "JavaScript, Git, APIs REST"],
    ["Atlas Retail", "Backend Node.js y MySQL", "Barcelona", "full_time", "2200", "Node.js, SQL, Docker"],
    ["Nexa Digital", "Maquetadora web", "Valencia", "part_time", "1600", "HTML, CSS, WordPress"],
    ["Brisa Software", "QA Automation", "Alicante (híbrido)", "short_term", "experience", "Playwright, JavaScript"],
  ]) {
    const [empresa, title, location, employment_type, salary, skills_required] = o;
    ofertas[title] = (await llamar("/jobs", { method: "POST", token: marta, body: {
      company_id: empresas[empresa], title, location, employment_type, salary, skills_required,
      description: `Buscamos ${title.toLowerCase()} para incorporarse al equipo de ${empresa}. Valoramos: ${skills_required}.` } })).id;
  }

  // Postulaciones de Lucia, con consentimiento y firma como en la app
  const postular = async (titulo, notes) => (await llamar("/applications", { method: "POST", token: lucia,
    body: { job_offer_id: ofertas[titulo], notes, consent: true, signature: "Lucía Navarro" } })).id;
  const p1 = await postular("Full Stack Node.js", "Encaja con mi proyecto de API en Express.");
  const p2 = await postular("Junior Web Developer", "Remoto: ideal.");
  const p3 = await postular("Backend Node.js y MySQL", null);

  // Otros candidatos, para que la empresa no vea solo a Lucia
  const pablo = await usuario("Pablo Ortega", "pablo.ortega@correo.es", "candidate",
    { sector: "Diseño web", phone: "655 210 987", location: "Valencia", profile_visible: true });
  const irene = await usuario("Irene Soler", "irene.soler@correo.es", "candidate",
    { sector: "Testing", phone: "622 118 430", location: "Alicante", profile_visible: true });
  const p4 = (await llamar("/applications", { method: "POST", token: pablo,
    body: { job_offer_id: ofertas["Maquetadora web"], consent: true, signature: "Pablo Ortega" } })).id;
  const p5 = (await llamar("/applications", { method: "POST", token: irene,
    body: { job_offer_id: ofertas["QA Automation"], consent: true, signature: "Irene Soler" } })).id;

  // La reclutadora mueve los estados y agenda las entrevistas
  const estado = (id, status) => llamar(`/applications/${id}/status`, { method: "PUT", token: marta, body: { status } });
  await estado(p1, "interview");
  await estado(p2, "applied");
  await estado(p3, "interview");
  await estado(p4, "applied");
  await estado(p5, "offer");

  for (const [app, dia, hora, location, notes] of [
    [p1, 1, "10:00", "Oficina de Brisa Software, Alicante", "Entrevista técnica con el equipo de backend."],
    [p3, 3, "16:30", "Videollamada", "Primera entrevista con recursos humanos."],
    [p1, 4, "12:00", "Videollamada", "Prueba práctica: pequeña API en Express."],
  ]) await llamar("/interviews", { method: "POST", token: marta, body: { application_id: app, scheduled_date: estaSemana(dia, hora), location, notes } });

  console.log("Datos de demo creados. Acceso (contraseña " + CLAVE + "):");
  console.log("  candidata:    lucia.navarro@correo.es");
  console.log("  reclutadora:  marta@nexadigital.es");
})().catch(e => { console.error(e.message); process.exit(1); });
