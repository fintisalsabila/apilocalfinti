const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    // database: 'trainingapps' (isi percobaan project modul training)
    // database: 'training_ahass' (isi percobaan project modul training + audit tools)
    database: 'flp_ahass'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

module.exports = db;