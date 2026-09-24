/*=========================================
            BOTÓN SUBIR
=========================================*/

function scrollTopButton() {

    const button = document.getElementById("backToTop");

    if (!button) return;

    window.addEventListener("scroll", () => {

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

    window.addEventListener("scroll", () => {

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

    window.addEventListener("scroll", () => {

        let current = "";

        sections.forEach(section => {

            const top = section.offsetTop - 140;

            if (pageYOffset >= top) {

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

    // Aplicar tema guardado
    if (savedTheme === "light") {

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

    function openLightbox(image) {

        lightboxImg.src = image.src;
        lightboxImg.alt = image.alt;
        lightboxEl.classList.add("show");

    }

    function closeLightbox() {

        lightboxEl.classList.remove("show");
        lightboxImg.src = "";

    }

    images.forEach(image => {

        image.addEventListener("click", () => {

            openLightbox(image);

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

        if (event.key === "Escape" && lightboxEl.classList.contains("show")) {

            closeLightbox();

        }

    });

}


/*=========================================
            INICIALIZACIÓN
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    themeSwitcher();

    lightbox();

    scrollTopButton();

    progressBar();

    revealAnimations();

    fadeInOnScroll();

    scrollSpy();

});

const greeting = "Hola, bienvenido a mi portafolio";
const form = document.getElementById("contact-form");

console.log(greeting);

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
            alert("Por favor, completa todos los campos antes de enviar el formulario.");
            return;
        }

        //valida el formato del correo electónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, escribe un correo válido.");
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

                    alert("Gracias por su mensaje, " + name + "! Me pondré en contacto contigo pronto.");
                    form.reset();

                } else {

                    alert("No se ha podido enviar el mensaje. Inténtalo de nuevo en unos minutos o escríbeme directamente a ana.borrell.richart79@gmail.com.");

                }

            })
            .catch(() => {

                alert("No se ha podido enviar el mensaje. Comprueba tu conexión o escríbeme directamente a ana.borrell.richart79@gmail.com.");

            })
            .finally(() => {

                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;

            });
    });
}