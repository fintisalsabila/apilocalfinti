const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();

app.use(bodyParser.json());

const port = 3000;

// GET all audit_history records
app.get('/listAuditHistory', (req, res) => {
    let sql = 'SELECT * FROM audit_history';
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({"status": 500, error: err.message });
        } else {
            res.status(200).json({"status": 200, error: null, result: results });
        }
    });
});

// POST a new audit_history record
app.post('/addAuditHistory', (req, res) => {
    let newRecord = {
        audit_id: req.body.audit_id,
        tool_id: req.body.tool_id,
        tool_present: req.body.tool_present,
        kondisi: req.body.kondisi,
        photo_path: req.body.photo_path,
        audit_date: req.body.audit_date,
        created_by: req.body.created_by
    };
    let sql = 'INSERT INTO audit_history SET ?';
    db.query(sql, newRecord, (err, result) => {
        if (err) {
            res.send(JSON.stringify({ "status": 500, "message": "Database insert error", "error": err }));
            return;
        }
        res.send(JSON.stringify({ "status": 200, "message": "Record added", "data": { id: result.insertId, ...newRecord } }));
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});