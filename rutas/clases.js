const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const verificarToken = require('../middleware/autenticacion');

const ARCHIVO = path.join(__dirname, '..', 'clases.json');

async function leerClases() {
    try {
        const datos = await fs.readFile(ARCHIVO, 'utf8');
        return JSON.parse(datos);
    } catch (e) {
        return [];
    }
}

async function guardarClases(clases) {
    await fs.writeFile(ARCHIVO, JSON.stringify(clases, null, 2));
}

router.get('/', async (req, res, next) => {
    try {
        const clases = await leerClases();
        res.json(clases);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const clases = await leerClases();
        const clase = clases.find(c => c.id === parseInt(req.params.id));
        if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });
        res.json(clase);
    } catch (error) {
        next(error);
    }
});

// reservar
router.post('/:id/reservar', verificarToken, async (req, res, next) => {
    try {
        const { asiento } = req.body;
        if (!asiento && asiento !== 0) {
            return res.status(400).json({ mensaje: 'Indica el numero de asiento' });
        }

        const clases = await leerClases();
        const indice = clases.findIndex(c => c.id === parseInt(req.params.id));
        if (indice === -1) return res.status(404).json({ mensaje: 'Clase no encontrada' });

        const clase = clases[indice];
        const totalAsientos = clase.filas * clase.columnas;

        if (asiento < 1 || asiento > totalAsientos) {
            return res.status(400).json({ mensaje: 'Asiento invalido' });
        }

        if (clase.reservas.find(r => r.asiento === asiento)) {
            return res.status(400).json({ mensaje: 'Lugar ocupado' });
        }

        // que no repita reserva
        if (clase.reservas.find(r => r.usuario === req.usuario.email)) {
            return res.status(400).json({ mensaje: 'Ya tienes lugar aqui' });
        }

        clase.reservas.push({
            asiento,
            usuario: req.usuario.email,
            nombre: req.body.nombre || 'Usuario',
            fecha: new Date().toISOString()
        });

        await guardarClases(clases);
        res.json({ mensaje: 'Reservado', clase });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id/cancelar', verificarToken, async (req, res, next) => {
    try {
        const clases = await leerClases();
        const indice = clases.findIndex(c => c.id === parseInt(req.params.id));
        if (indice === -1) return res.status(404).json({ mensaje: 'Clase no encontrada' });

        const clase = clases[indice];
        const idx = clase.reservas.findIndex(r => r.usuario === req.usuario.email);
        if (idx === -1) {
            return res.status(400).json({ mensaje: 'No tienes reserva aqui' });
        }

        clase.reservas.splice(idx, 1);
        await guardarClases(clases);
        res.json({ mensaje: 'Reserva cancelada', clase });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
