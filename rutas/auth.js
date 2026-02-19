const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const ARCHIVO_USUARIOS = path.join(__dirname, '..', 'usuarios.json');
const JWT_SECRET = 'dfG67gym$ecr3t';

async function leerUsuarios() {
    try {
        const datos = await fs.readFile(ARCHIVO_USUARIOS, 'utf8');
        return JSON.parse(datos);
    } catch (err) {
        return [];
    }
}

async function guardarUsuarios(usuarios) {
    await fs.writeFile(ARCHIVO_USUARIOS, JSON.stringify(usuarios, null, 2));
}

// registro
router.post('/register', async (req, res, next) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ mensaje: 'Faltan campos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ mensaje: 'Contraseña muy corta (min 6)' });
        }

        const usuarios = await leerUsuarios();

        if (usuarios.find(u => u.email === email)) {
            return res.status(400).json({ mensaje: 'Ese correo ya esta registrado' });
        }

        const hash = await bcrypt.hash(password, 10);

        const nuevoUsuario = {
            id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
            nombre,
            email,
            password: hash
        };

        usuarios.push(nuevoUsuario);
        await guardarUsuarios(usuarios);

        const token = jwt.sign(
            { id: nuevoUsuario.id, email: nuevoUsuario.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            mensaje: 'Cuenta creada',
            token,
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email
            }
        });

    } catch (error) {
        next(error);
    }
});

// login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                mensaje: 'Email y contraseña son obligatorios' 
            });
        }

        const usuarios = await leerUsuarios();

        const usuario = usuarios.find(u => u.email === email);
        if (!usuario) {
            return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
        }

        const passwordCorrecta = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            mensaje: 'Inicio de sesion exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
