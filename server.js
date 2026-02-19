const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const manejarErrores = require('./middleware/errores');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// si no existen los json los crea vacios
var archivos = ['usuarios.json', 'clases.json', 'maquinas.json'];
archivos.forEach(archivo => {
    const ruta = path.join(__dirname, archivo);
    if (!fs.existsSync(ruta)) {
        fs.writeFileSync(ruta, JSON.stringify([], null, 2));
    }
});

app.use('/api/auth', require('./rutas/auth'));
app.use('/api/clases', require('./rutas/clases'));
app.use('/api/maquinas', require('./rutas/maquinas'));

// cualquier otra ruta manda al index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(manejarErrores);

app.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});
