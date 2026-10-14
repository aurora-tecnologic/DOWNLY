const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const NODOS_COBALT = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
    'https://cobalt.api.timelessnesses.me/api/json'
];
let puntero = 0;

app.post('/api/analizar', async (req, res) => {
    const { url, calidad = '720', soloAudio = false } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    if (url.includes('tiktok.com')) {
        try {
            const tkRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: 8000 });
            const data = tkRes.data.data;
            if (!data) throw new Error('TikWM no devolvió datos');

            if (data.images && data.images.length > 0) {
                return res.json({
                    tipo: 'carrusel',
                    titulo: data.title || 'TikTok Carrusel',
                    audioFondo: data.music || null,
                    items: data.images.map((imgUrl, i) => ({ id: i, tipoItem: 'foto', miniatura: imgUrl, urlDescarga: imgUrl }))
                });
            }
            return res.json({ tipo: 'unico', titulo: data.title || 'TikTok Video', miniatura: data.cover, urlVideo: data.play, urlAudio: data.music });
        } catch (e) { console.log('TikWM falló, intentando Cobalt...'); }
    }

    for (let i = 0; i < NODOS_COBALT.length; i++) {
        const nodo = NODOS_COBALT[puntero];
        puntero = (puntero + 1) % NODOS_COBALT.length;
        try {
            const cobRes = await axios.post(nodo, { url: url, vQuality: calidad, isAudioOnly: soloAudio, aFormat: 'mp3' }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 10000
            });
            const d = cobRes.data;

            if (d.status === 'picker') {
                return res.json({
                    tipo: 'carrusel',
                    audioFondo: d.audio || null,
                    items: d.picker.map((item, index) => ({ id: index, tipoItem: item.type, miniatura: item.thumb || item.url, urlDescarga: item.url }))
                });
            }
            if (d.url) {
                return res.json({ tipo: 'unico', urlDescarga: d.url, titulo: 'Contenido descargado', miniatura: null });
            }
        } catch (err) { continue; }
    }
    res.status(500).json({ error: 'No se pudo extraer el contenido.' });
});

app.get('/api/forzar-descarga', async (req, res) => {
    const { fileUrl, nombre = 'archivo', ext = 'mp4' } = req.query;
    if (!fileUrl) return res.status(400).send('URL requerida');
    try {
        const respuesta = await axios({
            method: 'GET', url: fileUrl, responseType: 'stream', timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        res.setHeader('Content-Disposition', `attachment; filename="${nombre}.${ext}"`);
        res.setHeader('Content-Type', respuesta.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        respuesta.data.pipe(res);
    } catch (e) { res.status(500).send('Error al transmitir el archivo'); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
