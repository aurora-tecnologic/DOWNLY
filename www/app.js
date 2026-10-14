// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCOUkO40WkpoYXBs006yS8tS0qNhgAKeWk",
  authDomain: "downly-bffa7.firebaseapp.com",
  projectId: "downly-bffa7",
  storageBucket: "downly-bffa7.firebasestorage.app",
  messagingSenderId: "532051765589",
  appId: "1:532051765589:web:aa9d122226ebc55f92a7dc",
  measurementId: "G-3541FJFDTZ"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

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

// --- AUTENTICACIÓN CON FIREBASE ---
async function iniciarSesion() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) return alert('Completa todos los campos');
    try {
        await auth.signInWithEmailAndPassword(email, password);
        guardarDatosSeguros('usuario', { email: email, nombre: email.split('@')[0] });
        document.getElementById('nombre-usuario').textContent = email.split('@')[0];
        cambiarPantalla('pantalla-home');
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

async function registrarUsuario() {
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    if (!nombre || !email || !password) return alert('Completa todos los campos');
    if (password.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: nombre });
        guardarDatosSeguros('usuario', { email: email, nombre: nombre });
        document.getElementById('nombre-usuario').textContent = nombre;
        cambiarPantalla('pantalla-home');
    } catch (error) {
        alert('Error al registrarse: ' + error.message);
    }
}

async function loginGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        guardarDatosSeguros('usuario', { email: user.email, nombre: user.displayName });
        document.getElementById('nombre-usuario').textContent = user.displayName;
        cambiarPantalla('pantalla-home');
    } catch (error) {
        alert('Error al iniciar sesión con Google: ' + error.message);
    }
}

async function cerrarSesion() {
    try {
        await auth.signOut();
        localStorage.removeItem('usuario');
        cambiarPantalla('pantalla-login');
    } catch (error) { console.error('Error:', error); }
}

// --- ANÁLISIS DE ENLACES ---
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
            await botonIniciarColaDeDescarga(lista, (item, porcentaje) => actualizarUIBarra(porcentaje));
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
        img.onclick = () => { toggleSeleccionItem(item.urlDescarga); img.classList.toggle('seleccionado'); };
        visor.appendChild(img);
    });
}

async function botonDescargarSeleccionados() {
    if (!respuestaCarruselActual) return;
    const lista = prepararDescargaCarrusel(respuestaCarruselActual);
    if (lista.length === 0) return alert('Selecciona al menos un elemento');
    await botonIniciarColaDeDescarga(lista, (item, porcentaje) => actualizarUIBarra(porcentaje));
}

function actualizarUIBarra(porcentaje) {
    const panel = document.getElementById('panel-descarga');
    const barra = document.getElementById('barra-progreso');
    const estado = document.getElementById('estado-descarga');
    panel.classList.remove('descarga-oculta');
    panel.classList.add('descarga-visible');
    barra.style.width = porcentaje + '%';
    estado.textContent = `Descargando... ${porcentaje}%`;
    if (porcentaje >= 100) { estado.textContent = 'Descarga completada'; estado.style.color = '#00E5FF'; }
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
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
};
