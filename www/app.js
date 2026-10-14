// --- NAVEGACIÓN ---
function cambiarPantalla(idPantalla) {
    const pantallaActual = document.querySelector('.pantalla.activa');
    const pantallaNueva = document.getElementById(idPantalla);

    if (pantallaActual) {
        pantallaActual.classList.remove('activa');
        pantallaActual.classList.add('saliendo');
        setTimeout(() => pantallaActual.classList.remove('saliendo'), 500);
    }
    setTimeout(() => { pantallaNueva.classList.add('activa'); }, 100);
}

// --- ONBOARDING ---
let pasoOnboarding = 0;
function siguienteOnboarding() {
    const pasos = document.querySelectorAll('.paso');
    pasoOnboarding++;
    if (pasoOnboarding < pasos.length) {
        pasos.forEach(p => p.classList.remove('activo'));
        pasos[pasoOnboarding].classList.add('activo');
    } else {
        localStorage.setItem('onboardingVisto', 'true');
        cambiarPantalla('pantalla-login');
    }
}

// --- AUTENTICACIÓN ---
function iniciarSesion() {
    const email = document.getElementById('login-email').value;
    if (!email) return alert('Ingresa un correo');
    guardarDatosSeguros('usuario', { email: email, nombre: 'Usuario' });
    document.getElementById('nombre-usuario').textContent = 'Usuario';
    cambiarPantalla('pantalla-home');
}

function registrarUsuario() {
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    if (!nombre || !email) return alert('Completa los campos');
    guardarDatosSeguros('usuario', { email: email, nombre: nombre });
    document.getElementById('nombre-usuario').textContent = nombre;
    cambiarPantalla('pantalla-home');
}

function loginGoogle() {
    guardarDatosSeguros('usuario', { email: 'google@gmail.com', nombre: 'Usuario Google' });
    document.getElementById('nombre-usuario').textContent = 'Usuario Google';
    cambiarPantalla('pantalla-home');
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    cambiarPantalla('pantalla-login');
}

// --- ANÁLISIS DE ENLACES (Conecta con el Motor) ---
async function botonAnalizar() {
    const url = document.getElementById('url-input').value;
    if (!url) return alert('Pega un enlace primero');

    const alerta = document.getElementById('alerta-deteccion');
    const textoAlerta = document.getElementById('texto-alerta');
    textoAlerta.textContent = 'Analizando enlace...';
    alerta.classList.remove('alerta-oculta');
    alerta.classList.add('alerta-visible');

    try {
        const respuesta = await analizarEnlace(url, '720', false);
        
        if (respuesta.tipo === 'unico') {
            textoAlerta.textContent = 'Video único detectado. Iniciando descarga...';
            const lista = prepararDescargaUnica(respuesta, '720');
            await botonIniciarColaDeDescarga(lista, (item, porcentaje) => {
                actualizarUIBarra(porcentaje);
            });
        } else if (respuesta.tipo === 'carrusel') {
            textoAlerta.textContent = 'Carrusel detectado. Selecciona lo que quieras descargar.';
            llenarVisorCarrusel(respuesta.items);
        }
    } catch (error) {
        textoAlerta.textContent = 'Error al analizar. Verifica el enlace.';
    }
}

// --- VISOR DE CARRUSEL ---
let respuestaCarruselActual = null;
function llenarVisorCarrusel(items) {
    respuestaCarruselActual = { tipo: 'carrusel', items: items };
    const contenedor = document.getElementById('contenedor-carrusel');
    const visor = document.getElementById('visor-carrusel');
    visor.innerHTML = '';
    contenedor.classList.remove('carrusel-oculto');
    contenedor.classList.add('carrusel-visible');

    items.forEach((item) => {
        const img = document.createElement('img');
        img.src = item.miniatura;
        img.onclick = () => {
            const seleccionado = toggleSeleccionItem(item.urlDescarga);
            img.classList.toggle('seleccionado');
        };
        visor.appendChild(img);
    });
}

async function botonDescargarSeleccionados() {
    if (!respuestaCarruselActual) return;
    const lista = prepararDescargaCarrusel(respuestaCarruselActual);
    if (lista.length === 0) return alert('Selecciona al menos un elemento');
    
    await botonIniciarColaDeDescarga(lista, (item, porcentaje) => {
        actualizarUIBarra(porcentaje);
    });
}

// --- UI DE PROGRESO ---
function actualizarUIBarra(porcentaje) {
    const panel = document.getElementById('panel-descarga');
    const barra = document.getElementById('barra-progreso');
    const estado = document.getElementById('estado-descarga');
    
    panel.classList.remove('descarga-oculta');
    panel.classList.add('descarga-visible');
    
    barra.style.width = porcentaje + '%';
    estado.textContent = `Descargando... ${porcentaje}%`;
    
    if (porcentaje >= 100) {
        estado.textContent = 'Descarga completada';
        estado.style.color = '#00E5FF';
    }
}

// --- INICIALIZACIÓN ---
window.onload = () => {
    const usuario = obtenerDatosSeguros('usuario');
    const onboardingVisto = localStorage.getItem('onboardingVisto');

    if (usuario) {
        document.getElementById('nombre-usuario').textContent = usuario.nombre;
        cambiarPantalla('pantalla-home');
    } else if (onboardingVisto) {
        cambiarPantalla('pantalla-login');
    } else {
        cambiarPantalla('pantalla-onboarding');
    }
    
    verificarActualizacion();
};
