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

    if (!images.length) return;

    images.forEach(image => {

        image.style.cursor = "zoom-in";

        image.addEventListener("click", () => {

            window.open(image.src, "_blank");

        });

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

    scrollSpy();

});

const greeting = "Hola, bienvenido a mi portafolio";
const form = document.getElementById("contact-form");
const faders = document.querySelectorAll(".fade-in");

console.log(greeting);

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            entry.target.classList.add("visible");
        } else {
            entry.target.classList.remove("visible");
        }
    });
});

faders.forEach(article => {
    appearOnScroll.observe(article);
});


//configurar evento del formulario de contacto
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

    alert("Gracias por su mensaje, " + name + "! Me pondré en contacto contigo pronto.");
    form.reset();
});