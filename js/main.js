/*=========================================
        GESTOR COMUN DE SCROLL
=========================================*/

/*
    Antes habia tres listeners de scroll independientes (boton subir,
    barra de progreso y scroll spy) y cada uno hacia calculos en cada
    pixel de desplazamiento. Ahora hay uno solo, y el trabajo se agrupa
    dentro de requestAnimationFrame para que se ejecute como mucho una
    vez por fotograma, no decenas por segundo.
*/

const tareasDeScroll = [];
let scrollProgramado = false;

function alHacerScroll(tarea) {

    tareasDeScroll.push(tarea);

    // Se ejecuta una vez al registrarse, para partir del estado correcto.
    tarea();

}

// passive: true le dice al navegador que no vamos a bloquear el scroll,
// lo que le permite desplazar la pagina de forma mas fluida.
window.addEventListener("scroll", () => {

    if (scrollProgramado) return;

    scrollProgramado = true;

    requestAnimationFrame(() => {

        tareasDeScroll.forEach(tarea => tarea());
        scrollProgramado = false;

    });

}, { passive: true });


/*=========================================
            BOTÓN SUBIR
=========================================*/

function scrollTopButton() {

    const button = document.getElementById("backToTop");

    if (!button) return;

    // Se apunta al gestor comun de scroll en vez de crear su
    // propio listener: ver alPasarPorScroll() mas abajo.
    alHacerScroll(() => {

        if (window.scrollY > 400) {

            button.classList.add("show");

        } else {

            button.classList.remove("show");

        }

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}

/*=========================================
        BARRA DE PROGRESO
=========================================*/

function progressBar() {

    const bar = document.getElementById("progress-bar");

    if (!bar) return;

    alHacerScroll(() => {

        const scroll =
            document.documentElement.scrollTop;

        const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;

        const percent = (scroll / height) * 100;

        bar.style.width = `${percent}%`;

    });

}

/*=========================================
        ANIMACIONES
=========================================*/

function revealAnimations() {

    const cards = document.querySelectorAll(".card");

    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold: .15

    });

    cards.forEach(card => {

        observer.observe(card);

    });

}

/*=========================================
        APARICIÓN AL HACER SCROLL
=========================================*/

function fadeInOnScroll() {

    const faders = document.querySelectorAll(".fade-in");

    if (!faders.length) return;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                // Una vez mostrada, no hace falta seguir observándola.
                observer.unobserve(entry.target);

            }

        });

    }, {

        // Con umbral 0 basta con que asome un pixel: las tarjetas son mas
        // altas que la ventana y un umbral alto tardaba demasiado.
        threshold: 0,

        // El margen superior enorme hace que una tarjeta que ya ha quedado
        // por encima de la pantalla siga contando como visible. Sin esto, un
        // scroll muy rapido que la pase de largo la dejaria oculta para
        // siempre, porque el observer no se vuelve a disparar.
        // El -80px de abajo retrasa un poco la entrada, para que la animacion
        // se aprecie.
        rootMargin: "100000px 0px -80px 0px"

    });

    faders.forEach(element => {

        observer.observe(element);

    });

}


/*=========================================
            SCROLL SPY
=========================================*/

function scrollSpy() {

    const sections = document.querySelectorAll("section");

    const links = document.querySelectorAll("nav a");

    if (!sections.length || !links.length) return;

    alHacerScroll(() => {

        let current = "";

        sections.forEach(section => {

            const top = section.offsetTop - 140;

            if (window.scrollY >= top) {

                current = section.getAttribute("id");

            }

        });

        links.forEach(link => {

            link.classList.remove("active");

            if (link.getAttribute("href") === "#" + current) {

                link.classList.add("active");

            }

        });

    });

}


/*=========================================
            MODO OSCURO
=========================================*/

function themeSwitcher() {

    const button = document.getElementById("theme-toggle");

    if (!button) return;

    const icon = button.querySelector("i");

    const savedTheme = localStorage.getItem("theme");

    /*
        Si nunca ha elegido tema, se respeta la preferencia que tenga
        configurada en su sistema operativo. Si ya eligio, manda su
        eleccion guardada.
    */
    const prefiereClaro = window.matchMedia
        && window.matchMedia("(prefers-color-scheme: light)").matches;

    const temaInicial = savedTheme || (prefiereClaro ? "light" : "dark");

    // Aplicar tema guardado
    if (temaInicial === "light") {

        document.body.classList.add("light");

        if (icon) {

            icon.className = "fa-solid fa-sun";

        }

    } else {

        document.body.classList.remove("light");

        if (icon) {

            icon.className = "fa-solid fa-moon";

        }

    }

    // Cambio de tema
    button.addEventListener("click", () => {

        document.body.classList.toggle("light");

        const lightMode = document.body.classList.contains("light");

        localStorage.setItem(
            "theme",
            lightMode ? "light" : "dark"
        );

        if (icon) {

            icon.className = lightMode
                ? "fa-solid fa-sun"
                : "fa-solid fa-moon";

        }

    });

}


/*=========================================
                LIGHTBOX
=========================================*/

function lightbox() {

    const images = document.querySelectorAll("figure img");
    const lightboxEl = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeButton = document.getElementById("lightbox-close");

    if (!images.length || !lightboxEl || !lightboxImg) return;

    // Guarda quien tenia el foco para devolverselo al cerrar.
    let elementoPrevio = null;

    function openLightbox(image) {

        elementoPrevio = document.activeElement;

        lightboxImg.src = image.src;
        lightboxImg.alt = image.alt;
        lightboxEl.classList.add("show");

        // El foco entra en el dialogo, en el boton de cerrar.
        if (closeButton) closeButton.focus();

    }

    function closeLightbox() {

        lightboxEl.classList.remove("show");
        lightboxImg.src = "";

        // Devuelve el foco a la imagen desde la que se abrio.
        if (elementoPrevio && typeof elementoPrevio.focus === "function") {
            elementoPrevio.focus();
        }

    }

    images.forEach(image => {

        // tabindex y rol para poder abrirlo tambien con el teclado.
        image.setAttribute("tabindex", "0");
        image.setAttribute("role", "button");

        image.addEventListener("click", () => {

            openLightbox(image);

        });

        image.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();
                openLightbox(image);

            }

        });

    });

    if (closeButton) {

        closeButton.addEventListener("click", closeLightbox);

        closeButton.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();
                closeLightbox();

            }

        });

    }

    lightboxEl.addEventListener("click", (event) => {

        if (event.target === lightboxEl) {

            closeLightbox();

        }

    });

    document.addEventListener("keydown", (event) => {

        if (!lightboxEl.classList.contains("show")) return;

        if (event.key === "Escape") {

            closeLightbox();

        }

        // Mientras el dialogo este abierto, el tabulador no debe
        // escaparse al resto de la pagina que hay detras.
        if (event.key === "Tab" && closeButton) {

            event.preventDefault();
            closeButton.focus();

        }

    });

}


/*=========================================
            INICIALIZACIÓN
=========================================*/

/*=========================================
            VIDEOS DE DEMO
=========================================*/

/*
    Cualquier boton con data-video abre ese video en el <dialog>.
    El src se pone al abrir y se quita al cerrar: asi el video no se
    descarga hasta que alguien lo pide y deja de bajar al cerrarlo.
*/
function videoModal() {

    const modal = document.getElementById("video-modal");
    const botones = document.querySelectorAll("[data-video]");

    if (!modal || !botones.length || typeof modal.showModal !== "function") return;

    const video = modal.querySelector("video");
    const titulo = modal.querySelector("#video-modal-titulo");
    const descripcion = modal.querySelector(".video-modal-descripcion");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            titulo.textContent = boton.dataset.titulo || "Demo";
            descripcion.textContent = boton.dataset.descripcion || "";
            video.poster = boton.dataset.poster || "";
            video.src = boton.dataset.video;
            modal.showModal();
            video.play().catch(() => {});
        });
    });

    modal.addEventListener("close", () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
    });

    modal.querySelector(".video-modal-cerrar").addEventListener("click", () => modal.close());

    // Clic fuera del contenido (en el fondo oscuro) = cerrar
    modal.addEventListener("click", e => {
        if (e.target === modal) modal.close();
    });
}

document.addEventListener("DOMContentLoaded", () => {

    themeSwitcher();

    lightbox();

    videoModal();

    scrollTopButton();

    progressBar();

    revealAnimations();

    fadeInOnScroll();

    scrollSpy();

});

const form = document.getElementById("contact-form");

/*
    Muestra un aviso dentro de la pagina. Sustituye a los alert(),
    que bloquean el navegador y quedan poco profesionales.
    El elemento tiene role="status", asi que los lectores de pantalla
    lo anuncian solos al cambiar su contenido.
*/
function mostrarAviso(texto, tipo) {

    const aviso = document.getElementById("form-status");

    if (!aviso) return;

    aviso.textContent = texto;
    aviso.className = "form-status visible " + tipo;

}

//configurar evento del formulario de contacto
if (form) {
    const submitButton = form.querySelector("button[type='submit']");

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const message = document.getElementById("message").value;

    //verifica los campos del formulario
        if (!name || !email || !message) {
            mostrarAviso("Por favor, completa todos los campos antes de enviar el formulario.", "error");
            return;
        }

        //valida el formato del correo electónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarAviso("Por favor, escribe un correo válido.", "error");
            return;
        }

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";

        const formData = new FormData(form);

        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData
        })
            .then(response => response.json())
            .then(data => {

                if (data.success) {

                    mostrarAviso("¡Gracias por tu mensaje, " + name + "! Me pondré en contacto contigo pronto.", "exito");
                    form.reset();

                } else {

                    mostrarAviso("No se ha podido enviar el mensaje. Inténtalo de nuevo en unos minutos o escríbeme directamente a ana.borrell.richart79@gmail.com.", "error");

                }

            })
            .catch(() => {

                mostrarAviso("No se ha podido enviar el mensaje. Comprueba tu conexión o escríbeme directamente a ana.borrell.richart79@gmail.com.", "error");

            })
            .finally(() => {

                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;

            });
    });
}