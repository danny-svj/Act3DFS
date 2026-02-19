const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dfG67gym$ecr3t';

const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ mensaje: 'No hay token' });
    }

    try {
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        const datosUsuario = jwt.verify(token, JWT_SECRET);
        req.usuario = datosUsuario;
        next();
    } catch (err) {
        res.status(401).json({ mensaje: 'Token invalido' });
    }
};

module.exports = verificarToken;
