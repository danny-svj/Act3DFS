const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const manejarErrores = require('./middleware/errores');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// crear archivos de datos si no existen
['usuarios.json', 'clases.json', 'maquinas.json'].forEach(archivo => {
    const ruta = path.join(__dirname, archivo);
    if (!fs.existsSync(ruta)) {
        fs.writeFileSync(ruta, JSON.stringify([], null, 2));
    }
});

// rutas
app.use('/api/auth', require('./rutas/auth'));
app.use('/api/clases', require('./rutas/clases'));
app.use('/api/maquinas', require('./rutas/maquinas'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(manejarErrores);

const PUERTO = 3000;
app.listen(PUERTO, () => {
    console.log(`67GYM corriendo en http://localhost:${PUERTO}`);
});
