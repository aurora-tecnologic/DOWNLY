// ============================================================
// MOTOR DE DESCARGAS DOWNLY
// ============================================================
const URL_BACKEND = 'https://downly-server-prueba-beta-v-1-0.onrender.com'; // CAMBIA ESTO POR TU URL DE RENDER

let itemsSeleccionados = new Set();

async function analizarEnlace(url, calidad = '720', soloAudio = false) {
    try {
        const response = await fetch(`${URL_BACKEND}/api/analizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, calidad, soloAudio })
        });
        if (!response.ok) throw new Error('Error en el servidor');
        return await response.json();
    } catch (error) {
        console.error('Error al analizar:', error);
        throw error;
    }
}

function toggleSeleccionItem(urlDescarga) {
    if (itemsSeleccionados.has(urlDescarga)) itemsSeleccionados.delete(urlDescarga);
    else itemsSeleccionados.add(urlDescarga);
    return itemsSeleccionados.size;
}

async function motorDescargarArchivo(urlDirecta, nombreArchivo, extension, callbackProgreso) {
    const urlFinal = `${URL_BACKEND}/api/forzar-descarga?fileUrl=${encodeURIComponent(urlDirecta)}&nombre=${encodeURIComponent(nombreArchivo)}&ext=${extension}`;
    try {
        const response = await fetch(urlFinal);
        if (!response.ok) throw new Error('Error al descargar');
        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        let bytesRecibidos = 0;
        const chunks = [];
        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            bytesRecibidos += value.length;
            if (totalBytes && callbackProgreso) {
                callbackProgreso(Math.round((bytesRecibidos / totalBytes) * 100));
            }
        }

        const blob = new Blob(chunks);
        const linkFantasma = document.createElement('a');
        linkFantasma.href = URL.createObjectURL(blob);
        linkFantasma.download = `${nombreArchivo}.${extension}`;
        document.body.appendChild(linkFantasma);
        linkFantasma.click();
        document.body.removeChild(linkFantasma);
        URL.revokeObjectURL(linkFantasma.href);
        return { exito: true, nombre: nombreArchivo };
    } catch (error) {
        return { exito: false, nombre: nombreArchivo, error: error.message };
    }
}

async function botonIniciarColaDeDescarga(listaDeObjetosADescargar, callbackProgresoGlobal) {
    const LIMITE_SIMULTANEO = 3;
    const cola = [...listaDeObjetosADescargar];
    const resultados = [];

    async function trabajador() {
        while (cola.length > 0) {
            const item = cola.shift();
            try {
                const resultado = await motorDescargarArchivo(item.urlDirecta, item.nombre, item.ext, (porcentaje) => {
                    if (callbackProgresoGlobal) callbackProgresoGlobal(item, porcentaje);
                });
                resultados.push(resultado);
            } catch (error) {
                resultados.push({ exito: false, nombre: item.nombre, error: error.message });
            }
        }
    }

    const motores = [];
    for (let i = 0; i < LIMITE_SIMULTANEO; i++) motores.push(trabajador());
    await Promise.all(motores);
    return resultados;
}

function prepararDescargaUnica(respuesta, calidad) {
    if (respuesta.tipo === 'unico') {
        return [{ urlDirecta: respuesta.urlDescarga || respuesta.urlVideo, nombre: `downly_${Date.now()}`, ext: 'mp4' }];
    }
    return [];
}

function prepararDescargaCarrusel(respuesta) {
    const items = respuesta.items.filter(item => itemsSeleccionados.has(item.urlDescarga));
    return items.map((item, index) => {
        let ext = 'jpg';
        if (item.tipoItem === 'video' || item.urlDescarga.includes('.mp4')) ext = 'mp4';
        else if (item.urlDescarga.includes('.png')) ext = 'png';
        return { urlDirecta: item.urlDescarga, nombre: `downly_${index + 1}_${Date.now()}`, ext: ext };
    });
}
