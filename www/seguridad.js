// --- SEGURIDAD Y CIFRADO ---
const CLAVE_SECRETA = "DownlySecure2026Key!"; 

function guardarDatosSeguros(clave, valor) {
    try {
        const valorCifrado = CryptoJS.AES.encrypt(JSON.stringify(valor), CLAVE_SECRETA).toString();
        localStorage.setItem(clave, valorCifrado);
    } catch(e) {
        console.error("Error guardando datos", e);
    }
}

function obtenerDatosSeguros(clave) {
    const valorCifrado = localStorage.getItem(clave);
    if (!valorCifrado) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(valorCifrado, CLAVE_SECRETA);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (e) {
        return null;
    }
}

// --- ANTI-MANIPULACIÓN ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        return false;
    }
};

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT' && !node.src.includes(window.location.hostname)) {
                console.error("Intento de inyección detectado");
            }
        });
    });
});
observer.observe(document.body, { childList: true, subtree: true });

// --- ACTUALIZACIÓN FORZADA ---
const VERSION_ACTUAL = "1.0.0";
const URL_VERSION = "https://tu-servidor.com/version.json"; 

async function verificarActualizacion() {
    try {
        const response = await fetch(URL_VERSION);
        const data = await response.json();
        
        if (data.version > VERSION_ACTUAL) {
            document.body.innerHTML = `
                <div style="position: fixed; top:0; left:0; width:100%; height:100%; background: #02060E; display: flex; justify-content: center; align-items: center; flex-direction: column; z-index: 9999; padding: 24px;">
                    <div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 32px; text-align: center; max-width: 400px;">
                        <h2 style="color: white; font-family: sans-serif; margin-bottom: 16px;">Actualización Requerida</h2>
                        <p style="color: rgba(255,255,255,0.7); font-family: sans-serif; margin-bottom: 24px;">Hay una nueva versión disponible. Actualiza para continuar.</p>
                        <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                            <div id="barra-actualizacion" style="width: 0%; height: 100%; background: linear-gradient(90deg, #0356C5, #00E5FF); transition: width 0.3s;"></div>
                        </div>
                        <button id="btn-actualizar" style="width: 100%; padding: 16px; border: none; border-radius: 16px; background: linear-gradient(135deg, #0356C5, #00E5FF); color: white; font-size: 1.1rem; font-weight: bold; cursor: pointer; opacity: 0.5;" disabled>Descargando...</button>
                    </div>
                </div>
            `;
            let progreso = 0;
            const barra = document.getElementById('barra-actualizacion');
            const boton = document.getElementById('btn-actualizar');
            const intervalo = setInterval(() => {
                progreso += Math.random() * 10;
                if (progreso >= 100) {
                    progreso = 100;
                    clearInterval(intervalo);
                    boton.disabled = false;
                    boton.style.opacity = '1';
                    boton.textContent = 'Instalar Actualización';
                    boton.onclick = () => alert('Reiniciando para instalar...');
                }
                barra.style.width = progreso + '%';
            }, 300);
        }
    } catch (error) {
        console.log("Modo offline");
    }
}
