const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const ARCHIVO_USUARIOS = path.join(__dirname, '..', 'usuarios.json');
const JWT_SECRET = 'mi_clave_secreta_para_jwt_2024'; // TODO: poner en .env

async function leerUsuarios() {
    try {
        const datos = await fs.readFile(ARCHIVO_USUARIOS, 'utf8');
        return JSON.parse(datos);
    } catch (error) {
        console.log('Error leyendo usuarios:', error.message);
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
            return res.status(400).json({ 
                mensaje: 'Todos los campos son obligatorios' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                mensaje: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        const usuarios = await leerUsuarios();

        const yaExiste = usuarios.find(u => u.email === email);
        if (yaExiste) {
            return res.status(400).json({ mensaje: 'Ya hay una cuenta con ese correo' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptado = await bcrypt.hash(password, salt);

        const nuevoUsuario = {
            id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
            nombre,
            email,
            password: passwordEncriptado
        };

        usuarios.push(nuevoUsuario);
        await guardarUsuarios(usuarios);

        const token = jwt.sign(
            { id: nuevoUsuario.id, email: nuevoUsuario.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Nuevo usuario:', email);

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
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
