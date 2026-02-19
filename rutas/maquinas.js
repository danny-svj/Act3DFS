const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const ARCHIVO = path.join(__dirname, '..', 'maquinas.json');

async function leerMaquinas() {
    try {
        const datos = await fs.readFile(ARCHIVO, 'utf8');
        return JSON.parse(datos);
    } catch (e) {
        return [];
    }
}

// todas las maquinas (publico, sin token)
router.get('/', async (req, res, next) => {
    try {
        const maquinas = await leerMaquinas();
        res.json(maquinas);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
