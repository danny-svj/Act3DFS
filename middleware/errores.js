const manejarErrores = (err, req, res, next) => {
    console.error(err.message);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ mensaje: 'JSON mal formado' });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ mensaje: 'Token invalido' });
    }

    res.status(500).json({ mensaje: 'Error del servidor' });
};

module.exports = manejarErrores;
