// manejo de errores global
const manejarErrores = (err, req, res, next) => {
    console.error('ERROR:', err.message, '-', req.method, req.originalUrl);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ 
            mensaje: 'JSON mal formado' 
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            mensaje: 'Token no valido' 
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            mensaje: 'Token expirado' 
        });
    }

    res.status(err.statusCode || 500).json({
        mensaje: err.message || 'Error interno del servidor'
    });
};

module.exports = manejarErrores;
