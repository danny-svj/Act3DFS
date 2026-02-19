const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mi_clave_secreta_para_jwt_2024'; // TODO: mover a .env

const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ 
            mensaje: 'Acceso denegado, no hay token' 
        });
    }

    try {
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        const datosUsuario = jwt.verify(token, JWT_SECRET);
        req.usuario = datosUsuario;
        next();
    } catch (error) {
        console.log('Token invalido:', error.message);
        res.status(401).json({ mensaje: 'Token no valido o expirado' });
    }
};

module.exports = verificarToken;
