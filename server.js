const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();

app.use(bodyParser.json());

const port = 3001;
const localIp = '192.168.18.58';


app.get('/listAudits', (req, res) => {
    let sql = `
      SELECT * FROM audits
      WHERE (IdTool, audit_date) IN (
        SELECT IdTool, MAX(audit_date) AS max_audit_date
        FROM audits
        GROUP BY IdTool
      )
      ORDER BY audit_date DESC
    `;
    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ "status": 500, error: err.message });
      } else {
        res.status(200).json({ "status": 200, error: null, result: results });
      }
    });
  });


// POST a new audit record
app.post('/addAudit', (req, res) => {
    let newRecord = {
        IdTool: req.body.IdTool,
        audit_date: req.body.audit_date,
        photo_path: req.body.photo_path,
        kondisi: req.body.kondisi,
        description: req.body.description,
        created_by: req.body.created_by,
        created_at: new Date(),
        updated_at: new Date()
    };
    let sql = 'INSERT INTO audits SET ?';
    db.query(sql, newRecord, (err, result) => {
        if (err) {
            res.status(500).json({ "status": 500, "message": "Database insert error", "error": err });
        } else {
            res.status(200).json({ "status": 200, "message": "Record added", "data": { id: result.insertId, ...newRecord } });
        }
    });
});

// GET all master_tools records
app.get('/listTools', (req, res) => {
    let sql = 'SELECT * FROM master_tools';
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ "status": 500, error: err.message });
        } else {
            res.status(200).json({ "status": 200, error: null, result: results });
        }
    });
});

// POST a new tool record
app.post('/addTool', (req, res) => {
    let newRecord = {
        tool_name: req.body.tool_name,
        tool_detail: req.body.tool_detail,
        status: req.body.status,
        created_by: req.body.created_by,
        created_at: new Date(),
        updated_at: new Date()
    };
    let sql = 'INSERT INTO master_tools SET ?';
    db.query(sql, newRecord, (err, result) => {
        if (err) {
            res.status(500).json({ "status": 500, "message": "Database insert error", "error": err });
        } else {
            res.status(200).json({ "status": 200, "message": "Record added", "data": { id: result.insertId, ...newRecord } });
        }
    });
});

// Start the server
app.listen(port, localIp, () => {
    console.log(`Server running at http://${localIp}:${port}/`);
});