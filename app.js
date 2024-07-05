const express = require('express');
const multer = require('multer');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

// Configuración de conexión a MySQL
const db = mysql.createConnection({
    host: '10.0.6.39',
    user: 'estudiante',
    password: 'Info-2023',
    database: 'HeladeriaWebiContardo'
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error('Error al conectar con MySQL:', err);
        throw err;
    }
    console.log('Conexión a la base de datos MySQL establecida.');
});

// Middleware para gestionar la carga de archivos (multer)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/images/helados/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware para procesar datos JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para sesiones
app.use(session({
    secret: 'secret-key-for-session',
    resave: false,
    saveUninitialized: true
}));

// Sirve archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'pagina_principal')));

// Ruta para registrar un nuevo usuario
app.post('/registrar_usuario', (req, res) => {
    const { nombre, email, password } = req.body;

    // Insertar el nuevo usuario en la base de datos
    const query = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
    db.query(query, [nombre, email, password], (err, result) => {
        if (err) {
            res.send('Error al registrar el usuario');
        } else {
            console.log('Usuario registrado exitosamente');
            res.redirect('/');
        }
    });
});

// Ruta para iniciar sesión
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            res.status(500).send('Error al buscar usuario.');
        } else {
            if (results.length > 0) {
                const user = results[0];
                if (user.password === password) {
                    req.session.user = user;
                    res.status(200).json({ message: 'Inicio de sesión exitoso.' });
                } else {
                    res.status(401).send('Credenciales incorrectas.');
                }
            } else {
                res.status(404).send('Usuario no encontrado.');
            }
        }
    });
});

// Ruta para agregar helados con imagen
app.post('/admin/agregar_helado', upload.single('imagenHelado'), (req, res) => {
    const { nombre, descripcion, sabor, tipo, cobertura, precio } = req.body;
    const imagenHelado = req.file ? req.file.filename : null;

    if (!imagenHelado) {
        return res.status(400).send('No se ha subido ninguna imagen.');
    }

    const sql = "INSERT INTO Helado (nombre, descripcion, sabor, tipo, cobertura, precio, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [nombre, descripcion, sabor, tipo, cobertura, precio, imagenHelado], (err, result) => {
        if (err) {
            console.error('Error al agregar helado:', err);
            res.status(500).send('Error al agregar helado.');
        } else {
            console.log('Helado agregado correctamente.');
            res.status(200).json({ message: 'Helado agregado correctamente.' });
        }
    });
});

// Ruta para obtener todos los helados
app.get('/helados', (req, res) => {
    const sql = "SELECT * FROM Helado";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener helados:', err);
            res.status(500).send('Error al obtener helados.');
        } else {
            res.status(200).json(results);
        }
    });
});

// Ruta para obtener los detalles de un helado específico
app.get('/helado_especifico/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Helado WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al obtener los datos del helado:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        if (result.length === 0) {
            res.status(404).send('Helado no encontrado');
            return;
        }
        res.json(result[0]);
    });
});

// Ruta para eliminar un helado
app.delete('/admin/eliminar_helado/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Helado WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar helado:', err);
            res.status(500).send('Error al eliminar helado.');
        } else {
            if (result.affectedRows === 0) {
                res.status(404).send('Helado no encontrado');
            } else {
                console.log('Helado eliminado correctamente.');
                res.status(200).json({ message: 'Helado eliminado correctamente.' });
            }
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Node.js ejecutándose en http://localhost:${port}`);
});
