class GymApp {
    constructor() {
        this.API = '/api';
        this.token = localStorage.getItem('token') || null;
        this.usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        this.clases = [];
        this.maquinas = [];
        this.seccionActual = 'inicio';
        this.filtroClase = 'todas';
        this.filtroDia = 'todos';
        this.filtroMaquina = 'todas';
        this.claseSeleccionada = null;
        this.asientoSeleccionado = null;
        this.init();
    }

    init() {
        this.cargarDatos();
        this.actualizarSidebar();

        const hoy = new Date();
        const el = document.getElementById('fecha-hoy');
        if (el) {
            el.textContent = hoy.toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
        }
    }

    async cargarDatos() {
        await Promise.all([this.cargarClases(), this.cargarMaquinas()]);
        this.renderInicio();
    }

    actualizarSidebar() {
        const userEl = document.getElementById('sidebar-user');
        const loginEl = document.getElementById('sidebar-login');
        if (this.token && this.usuario) {
            userEl.style.display = 'block';
            loginEl.style.display = 'none';
            document.getElementById('sidebar-nombre').textContent = this.usuario.nombre;
            document.getElementById('sidebar-email').textContent = this.usuario.email;
        } else {
            userEl.style.display = 'none';
            loginEl.style.display = 'block';
        }
    }

    irALogin() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-principal').style.display = 'none';
    }

    volverPublico() {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-principal').style.display = 'flex';
    }

    mostrarLogin() {
        document.getElementById('form-login').style.display = 'block';
        document.getElementById('form-registro').style.display = 'none';
    }

    mostrarRegistro() {
        document.getElementById('form-login').style.display = 'none';
        document.getElementById('form-registro').style.display = 'block';
    }

    async login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) return this.alerta('Llena los campos', 'error');

        try {
            const resp = await fetch(this.API + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await resp.json();
            if (!resp.ok) return this.alerta(data.mensaje || 'Error', 'error');

            this.token = data.token;
            this.usuario = data.usuario;
            localStorage.setItem('token', this.token);
            localStorage.setItem('usuario', JSON.stringify(this.usuario));
            this.alerta('Bienvenido ' + data.usuario.nombre, 'exito');
            setTimeout(() => {
                this.volverPublico();
                this.actualizarSidebar();
                this.cargarDatos();
            }, 800);
        } catch (e) {
            this.alerta('Error de conexion', 'error');
        }
    }

    async registrarse() {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        if (!nombre || !email || !password) return this.alerta('Faltan campos', 'error');

        try {
            const resp = await fetch(this.API + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password })
            });
            const data = await resp.json();

            if (resp.ok) {
                this.alerta('Cuenta creada, inicia sesion', 'exito');
                document.getElementById('reg-nombre').value = '';
                document.getElementById('reg-email').value = '';
                document.getElementById('reg-password').value = '';
                setTimeout(() => this.mostrarLogin(), 1000);
            } else {
                this.alerta(data.mensaje || 'Error al registrar', 'error');
            }
        } catch (e) {
            this.alerta('Error de conexion', 'error');
        }
    }

    logout() {
        if (!confirm('Cerrar sesion?')) return;
        this.token = null;
        this.usuario = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        this.actualizarSidebar();
        this.renderInicio();
        this.alerta('Listo', 'exito');
    }

    irA(seccion) {
        this.seccionActual = seccion;
        document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
        const el = document.getElementById('seccion-' + seccion);
        if (el) el.classList.add('activa');

        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.seccion === seccion);
        });

        const titulos = {
            inicio: 'Inicio', clases: 'Clases',
            maquinas: 'Maquinas', mapa: 'Mapa del Gym', perfil: 'Mi Perfil'
        };
        document.getElementById('titulo-seccion').textContent = titulos[seccion] || seccion;

        if (seccion === 'inicio') this.renderInicio();
        if (seccion === 'clases') this.renderClases();
        if (seccion === 'maquinas') this.renderMaquinas();
        if (seccion === 'perfil') this.renderPerfil();

        document.getElementById('sidebar').classList.remove('abierto');
    }

    toggleMenu() {
        document.getElementById('sidebar').classList.toggle('abierto');
    }

    async cargarClases() {
        try {
            const resp = await fetch(this.API + '/clases');
            this.clases = await resp.json();
        } catch (e) {
            console.log('Error clases:', e);
        }
    }

    async cargarMaquinas() {
        try {
            const resp = await fetch(this.API + '/maquinas');
            this.maquinas = await resp.json();
        } catch (e) {
            console.log('Error maquinas:', e);
        }
    }

    renderInicio() {
        const diaHoy = this.getDiaHoy();
        const clasesHoy = this.clases.filter(c => c.dia === diaHoy);
        const activas = this.maquinas.filter(m => m.estado === 'disponible');
        const averiadas = this.maquinas.filter(m => m.estado === 'averiada');
        const misRes = this.token
            ? this.clases.filter(c => c.reservas.some(r => r.usuario === this.usuario?.email))
            : [];

        document.getElementById('stat-clases').textContent = clasesHoy.length;
        document.getElementById('stat-maquinas').textContent = activas.length;
        document.getElementById('stat-averiadas').textContent = averiadas.length;
        document.getElementById('stat-reservas').textContent = misRes.length;

        // proximas clases
        const cont = document.getElementById('proximas-clases');
        if (clasesHoy.length === 0) {
            cont.innerHTML = '<p class="vacio">No hay clases programadas hoy</p>';
        } else {
            let html = '';
            clasesHoy.forEach(c => {
                const info = this.tipoInfo(c.tipo);
                const libres = (c.filas * c.columnas) - c.reservas.length;
                html += `
                    <div class="mini-clase" onclick="App.irA('clases')">
                        <span class="material-icons-outlined mini-icono" style="color:${info.color}">${info.icono}</span>
                        <div class="mini-data">
                            <strong>${c.nombre}</strong>
                            <span>${c.horario} · ${libres} libres</span>
                        </div>
                    </div>`;
            });
            cont.innerHTML = html;
        }

        // averiadas
        const avCont = document.getElementById('averiadas-inicio');
        if (averiadas.length === 0) {
            avCont.innerHTML = '<p class="vacio">Todas las maquinas estan bien</p>';
        } else {
            let html = '';
            averiadas.forEach(m => {
                html += `
                    <div class="averiada-item">
                        <span class="material-icons-outlined" style="color:#ff1744;">warning</span>
                        <div>
                            <strong>${m.nombre}</strong>
                            <span>${m.zona}</span>
                        </div>
                    </div>`;
            });
            avCont.innerHTML = html;
        }
    }

    renderClases() {
        const cont = document.getElementById('clases-grid');
        let filtradas = this.clases;

        if (this.filtroClase !== 'todas') {
            filtradas = filtradas.filter(c => c.tipo === this.filtroClase);
        }
        if (this.filtroDia !== 'todos') {
            filtradas = filtradas.filter(c => c.dia === this.filtroDia);
        }

        if (filtradas.length === 0) {
            cont.innerHTML = '<p class="vacio">No hay clases con ese filtro</p>';
            return;
        }

        let html = '';
        filtradas.forEach(c => {
            const info = this.tipoInfo(c.tipo);
            const total = c.filas * c.columnas;
            const libres = total - c.reservas.length;
            const miReserva = this.usuario
                ? c.reservas.find(r => r.usuario === this.usuario.email) : null;

            html += `
                <div class="clase-card">
                    <div class="clase-tipo-badge" style="background:${info.color}15; color:${info.color}; border:1px solid ${info.color}30;">
                        <span class="material-icons-outlined">${info.icono}</span>
                        ${c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)}
                    </div>
                    <h4 class="clase-nombre">${c.nombre}</h4>
                    <div class="clase-detalles">
                        <span><span class="material-icons-outlined">person</span>${c.instructor}</span>
                        <span><span class="material-icons-outlined">schedule</span>${this.capitalizarDia(c.dia)} ${c.horario} (${c.duracion}min)</span>
                        <span><span class="material-icons-outlined">room</span>${c.sala}</span>
                        <span><span class="material-icons-outlined">event_seat</span>${libres} de ${total} libres</span>
                    </div>
                    ${miReserva ? `<div class="mi-reserva-badge">Tu lugar: #${miReserva.asiento}</div>` : ''}
                    <button class="btn-ver-lugares" onclick="App.abrirAsientos(${c.id})" style="border-color:${info.color}; color:${info.color};">
                        <span class="material-icons-outlined">event_seat</span>
                        Ver lugares
                    </button>
                </div>`;
        });
        cont.innerHTML = html;
    }

    filtrarClases(tipo) {
        this.filtroClase = tipo;
        document.querySelectorAll('#seccion-clases .filtro-btn:not(.dia-btn)').forEach(b => {
            b.classList.toggle('activo', b.dataset.tipo === tipo);
        });
        this.renderClases();
    }

    filtrarDia(dia) {
        this.filtroDia = dia;
        document.querySelectorAll('.dia-btn').forEach(b => {
            b.classList.toggle('activo', b.dataset.dia === dia);
        });
        this.renderClases();
    }

    renderMaquinas() {
        const cont = document.getElementById('maquinas-grid');
        let filtradas = this.maquinas;
        if (this.filtroMaquina !== 'todas') {
            filtradas = filtradas.filter(m => m.estado === this.filtroMaquina);
        }

        if (filtradas.length === 0) {
            cont.innerHTML = '<p class="vacio">No hay maquinas con ese estado</p>';
            return;
        }

        let html = '';
        filtradas.forEach(m => {
            const textoEstado = {
                disponible: 'Disponible',
                averiada: 'Averiada',
                mantenimiento: 'En mantenimiento'
            };
            html += `
                <div class="maquina-card ${m.estado}">
                    <div class="maquina-status">
                        <span class="status-dot ${m.estado}"></span>
                        ${textoEstado[m.estado]}
                    </div>
                    <span class="material-icons-outlined maquina-icono">${m.icono || 'fitness_center'}</span>
                    <h4>${m.nombre}</h4>
                    <span class="maquina-zona">${m.zona}</span>
                </div>`;
        });
        cont.innerHTML = html;
    }

    filtrarMaquinas(tipo) {
        this.filtroMaquina = tipo;
        document.querySelectorAll('#seccion-maquinas .filtro-btn').forEach(b => {
            b.classList.toggle('activo', b.dataset.tipo === tipo);
        });
        this.renderMaquinas();
    }

    abrirAsientos(id) {
        const clase = this.clases.find(c => c.id === id);
        if (!clase) return;

        this.claseSeleccionada = clase;
        this.asientoSeleccionado = null;

        document.getElementById('modal-clase-titulo').textContent = clase.nombre;
        document.getElementById('modal-instructor').innerHTML =
            `<span class="material-icons-outlined">person</span> ${clase.instructor}`;
        document.getElementById('modal-horario').innerHTML =
            `<span class="material-icons-outlined">schedule</span> ${this.capitalizarDia(clase.dia)} ${clase.horario}`;
        document.getElementById('modal-sala').innerHTML =
            `<span class="material-icons-outlined">room</span> ${clase.sala}`;

        this.renderAsientos(clase);
        document.getElementById('modal-asientos').style.display = 'flex';
    }

    renderAsientos(clase) {
        const grid = document.getElementById('asientos-grid');
        grid.style.gridTemplateColumns = `repeat(${clase.columnas}, 52px)`;

        const total = clase.filas * clase.columnas;
        const miReserva = this.usuario
            ? clase.reservas.find(r => r.usuario === this.usuario.email) : null;

        let html = '';
        for (let i = 1; i <= total; i++) {
            const reserva = clase.reservas.find(r => r.asiento === i);
            let estado = 'libre';
            let titulo = 'Disponible';

            if (reserva) {
                if (miReserva && miReserva.asiento === i) {
                    estado = 'mio';
                    titulo = 'Tu reserva';
                } else {
                    estado = 'ocupado';
                    titulo = 'Ocupado';
                }
            }

            const icono = this.iconoAsiento(clase.tipo);
            html += `<div class="asiento ${estado}" data-num="${i}" title="${titulo}" onclick="App.seleccionarAsiento(${i})">
                ${icono}<span class="asiento-num">${i}</span>
            </div>`;
        }
        grid.innerHTML = html;

        // footer
        const infoEl = document.getElementById('asiento-info');
        const btn = document.getElementById('btn-reservar');

        if (miReserva) {
            infoEl.textContent = `Tienes el lugar #${miReserva.asiento}`;
            btn.textContent = 'Cancelar mi reserva';
            btn.disabled = false;
            btn.className = 'btn-reservar btn-cancelar-reserva';
            btn.onclick = () => App.cancelarReserva();
        } else {
            infoEl.textContent = '';
            btn.textContent = 'Reservar lugar';
            btn.disabled = true;
            btn.className = 'btn-reservar';
            btn.onclick = () => App.confirmarReserva();
        }
    }

    seleccionarAsiento(num) {
        if (!this.claseSeleccionada) return;
        const reserva = this.claseSeleccionada.reservas.find(r => r.asiento === num);
        if (reserva) return;

        if (!this.token) return this.alerta('Inicia sesion primero', 'error');

        // quitar seleccion previa
        document.querySelectorAll('.asiento.seleccionado').forEach(el => {
            el.classList.remove('seleccionado');
            el.classList.add('libre');
        });

        const el = document.querySelector(`.asiento[data-num="${num}"]`);
        if (el) {
            el.classList.remove('libre');
            el.classList.add('seleccionado');
        }

        this.asientoSeleccionado = num;
        document.getElementById('asiento-info').textContent = `Lugar #${num} seleccionado`;
        document.getElementById('btn-reservar').disabled = false;
    }

    async confirmarReserva() {
        if (!this.token) return this.alerta('Inicia sesion', 'error');
        if (!this.asientoSeleccionado || !this.claseSeleccionada) return;

        try {
            const resp = await fetch(`${this.API}/clases/${this.claseSeleccionada.id}/reservar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.token
                },
                body: JSON.stringify({
                    asiento: this.asientoSeleccionado,
                    nombre: this.usuario.nombre
                })
            });

            const data = await resp.json();
            if (resp.ok) {
                this.alerta('Reservado!', 'exito');
                await this.cargarClases();
                this.claseSeleccionada = this.clases.find(c => c.id === this.claseSeleccionada.id);
                this.renderAsientos(this.claseSeleccionada);
                this.asientoSeleccionado = null;
            } else {
                this.alerta(data.mensaje || 'No se pudo reservar', 'error');
            }
        } catch (e) {
            this.alerta('Sin conexion', 'error');
        }
    }

    async cancelarReserva() {
        if (!this.claseSeleccionada) return;

        try {
            const resp = await fetch(`${this.API}/clases/${this.claseSeleccionada.id}/cancelar`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + this.token }
            });

            if (resp.ok) {
                this.alerta('Cancelado', 'exito');
                await this.cargarClases();
                this.claseSeleccionada = this.clases.find(c => c.id === this.claseSeleccionada.id);
                this.renderAsientos(this.claseSeleccionada);
            }
        } catch (e) {
            this.alerta('Error', 'error');
        }
    }

    cerrarModal() {
        document.getElementById('modal-asientos').style.display = 'none';
        this.claseSeleccionada = null;
        this.asientoSeleccionado = null;
    }

    infoZona(zona) {
        const panel = document.getElementById('zona-info');
        const titulo = document.getElementById('zona-info-titulo');
        const contenido = document.getElementById('zona-info-contenido');

        const zonas = {
            entrada: { titulo: 'Entrada Principal', desc: 'Acceso principal al gimnasio con torniquete de acceso y credencial.' },
            recepcion: { titulo: 'Recepcion', desc: 'Atencion al cliente, inscripciones, venta de suplementos y toallas.' },
            cardio: { titulo: 'Zona Cardio', desc: 'Area equipada con 4 caminadoras, 3 elipticas, 2 bicicletas estaticas y 2 maquinas de remo.' },
            pesas: { titulo: 'Zona de Pesas', desc: 'Cuenta con 2 bancos para press, 2 racks de sentadillas, prensa de piernas, Smith, poleas alta y baja, curl y extension.' },
            funcional: { titulo: 'Zona Funcional', desc: 'Espacio abierto con battle ropes, 2 estaciones TRX, box de salto y 2 sacos de boxeo.' },
            spinning: { titulo: 'Sala de Spinning', desc: '20 bicicletas de spinning organizadas en 4 filas. Sistema de sonido y pantalla frontal para el instructor.' },
            multiusos: { titulo: 'Sala Multiusos', desc: 'Salon amplio con espejos, sistema de audio. Se usa para clases de yoga, zumba y boxeo segun el horario.' },
            vestidores: { titulo: 'Vestidores', desc: 'Vestidores con lockers, regaderas, lavabos y area de secado. Separados por genero.' }
        };

        const info = zonas[zona];
        if (!info) return;

        titulo.textContent = info.titulo;

        // mostrar maquinas de esa zona si aplica
        let maqHTML = '';
        const zonaNombre = {
            cardio: 'Zona Cardio', pesas: 'Zona Pesas', funcional: 'Zona Funcional'
        };

        if (zonaNombre[zona]) {
            const maqsZona = this.maquinas.filter(m => m.zona === zonaNombre[zona]);
            if (maqsZona.length > 0) {
                maqHTML = '<div class="zona-maquinas">';
                maqsZona.forEach(m => {
                    const dotClass = m.estado;
                    maqHTML += `<div class="zona-maq-item"><span class="status-dot ${dotClass}"></span>${m.nombre}</div>`;
                });
                maqHTML += '</div>';
            }
        }

        contenido.innerHTML = `<p>${info.desc}</p>${maqHTML}`;
        panel.style.display = 'block';
    }

    renderPerfil() {
        const cont = document.getElementById('perfil-content');
        if (!this.token) {
            cont.innerHTML = `
                <div class="perfil-nologin">
                    <span class="material-icons-outlined" style="font-size:72px; color:#555;">lock</span>
                    <h3>Inicia sesion</h3>
                    <p>Para ver tus reservas y datos</p>
                    <button class="btn-auth" onclick="App.irALogin()">
                        <span class="material-icons-outlined">login</span> Iniciar Sesion
                    </button>
                </div>`;
            return;
        }

        const misReservas = this.clases.filter(c =>
            c.reservas.some(r => r.usuario === this.usuario.email)
        );

        let resHTML = '';
        if (misReservas.length === 0) {
            resHTML = '<p class="vacio">No tienes reservas activas</p>';
        } else {
            misReservas.forEach(c => {
                const r = c.reservas.find(r => r.usuario === this.usuario.email);
                const info = this.tipoInfo(c.tipo);
                resHTML += `
                    <div class="reserva-item">
                        <span class="material-icons-outlined" style="color:${info.color}">${info.icono}</span>
                        <div class="reserva-data">
                            <strong>${c.nombre}</strong>
                            <span>${this.capitalizarDia(c.dia)} ${c.horario} · Lugar #${r.asiento}</span>
                        </div>
                        <button class="btn-cancel-small" onclick="App.cancelarDesde(${c.id})">Cancelar</button>
                    </div>`;
            });
        }

        cont.innerHTML = `
            <div class="perfil-card">
                <span class="material-icons-outlined perfil-avatar">account_circle</span>
                <h2>${this.usuario.nombre}</h2>
                <p>${this.usuario.email}</p>
                <div class="perfil-stats">
                    <div><span>${misReservas.length}</span><small>Reservas</small></div>
                </div>
            </div>
            <div class="panel">
                <div class="panel-head"><h3>Mis reservas</h3></div>
                <div class="panel-body">${resHTML}</div>
            </div>`;
    }

    async cancelarDesde(claseId) {
        this.claseSeleccionada = this.clases.find(c => c.id === claseId);
        await this.cancelarReserva();
        this.renderPerfil();
    }

    tipoInfo(tipo) {
        const tipos = {
            spinning: { icono: 'pedal_bike', color: '#ff4d4d' },
            yoga: { icono: 'self_improvement', color: '#aa66ff' },
            crossfit: { icono: 'fitness_center', color: '#ff9100' },
            boxeo: { icono: 'sports_mma', color: '#ff1744' },
            zumba: { icono: 'music_note', color: '#00e676' }
        };
        return tipos[tipo] || { icono: 'fitness_center', color: '#2979ff' };
    }

    iconoAsiento(tipo) {
        const iconos = {
            spinning: '<span class="material-icons-outlined seat-icon">pedal_bike</span>',
            yoga: '<span class="material-icons-outlined seat-icon">self_improvement</span>',
            crossfit: '<span class="material-icons-outlined seat-icon">fitness_center</span>',
            boxeo: '<span class="material-icons-outlined seat-icon">sports_mma</span>',
            zumba: '<span class="material-icons-outlined seat-icon">music_note</span>'
        };
        return iconos[tipo] || '';
    }

    getDiaHoy() {
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        return dias[new Date().getDay()];
    }

    capitalizarDia(dia) {
        return dia.charAt(0).toUpperCase() + dia.slice(1);
    }

    alerta(msg, tipo) {
        const el = document.getElementById('alerta');
        el.textContent = msg;
        el.className = 'alerta-toast ' + tipo;
        el.style.display = 'flex';
        setTimeout(() => el.style.display = 'none', 3000);
    }
}

let App;
document.addEventListener('DOMContentLoaded', () => {
    App = new GymApp();
});
