const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();

app.use(bodyParser.json());

const port = 3001;
const localIp = '192.168.18.28';

/// API UNTUK AUDIT TOOLS
// GET all audits records
app.get('/listAudits', (req, res) => {
    let sql = `
      SELECT * FROM audits
      WHERE (IdTool, auditDate) IN (
        SELECT IdTool, MAX(auditDate) AS max_audit_date
        FROM audits
        GROUP BY IdTool
      )
      ORDER BY auditDate DESC
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
        auditDate: req.body.auditDate,
        photoPath: req.body.photoPath,
        kondisi: req.body.kondisi,
        description: req.body.description,
        createdBy: req.body.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
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
        toolName: req.body.toolName,
        toolDetail: req.body.toolDetail,
        status: req.body.status,
        createdBy: req.body.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
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


//////////////////// NodeJs untuk project "Pemesanan Tools" ////////////////////////
// GET all catalog tools
app.get('/listCatalogTools', (req, res) => {
    let sql = 'SELECT * FROM catalog_tools';
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ "status": 500, error: err.message });
        } else {
            res.status(200).json({ "status": 200, error: null, result: results });
        }
    });
});

// POST a new tool order and decrease stock
app.post('/addToolOrder', (req, res) => {
    const toolOrders = req.body;

    if (!Array.isArray(toolOrders)) {
        return res.status(400).json({ status: 400, message: 'Invalid input, expected an array' });
    }

    const insertOrders = toolOrders.map(order => {
        return {
            IdTransaction: order.IdTransaction,
            IdOrderTool: order.IdOrderTool,
            orderQuantity: order.orderQuantity,
            totalOrder: order.totalOrder,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };
    });

    const query = 'INSERT INTO tool_orders (IdTransaction, IdOrderTool, orderQuantity, totalOrder, totalPrice, createdAt, updatedAt) VALUES ?';
    
    const values = insertOrders.map(order => [order.IdTransaction, order.IdOrderTool, order.orderQuantity, order.totalOrder, order.totalPrice, order.createdAt, order.updatedAt]);

    // Perform the database transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ status: 500, message: 'Transaction error' });
        }

        // Insert orders
        db.query(query, [values], (error, results) => {
            if (error) {
                return db.rollback(() => {
                    res.status(500).json({ status: 500, message: 'Database error' });
                });
            }

            // Update stock after inserting orders
            const updateStockPromises = toolOrders.map(order => {
                return new Promise((resolve, reject) => {
                    const updateStockQuery = `UPDATE catalog_tools SET stock = stock - ? WHERE IdOrderTool = ? AND stock >= ?`;

                    db.query(updateStockQuery, [order.orderQuantity, order.IdOrderTool, order.orderQuantity], (error, results) => {
                        if (error || results.affectedRows === 0) {
                            return reject(new Error('Failed to update stock or insufficient stock'));
                        }
                        resolve();
                    });
                });
            });

            Promise.all(updateStockPromises)
                .then(() => {
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ status: 500, message: 'Commit error' });
                            });
                        }

                        res.json({
                            status: 200,
                            message: 'Orders added and stock updated successfully',
                            result: {
                                insertedOrderCount: results.affectedRows
                            }
                        });
                    });
                })
                .catch(error => {
                    db.rollback(() => {
                        res.status(500).json({ status: 500, message: error.message });
                    });
                });
        });
    });
});


////////////////////////////////////////////////////////////////////////

// Start the server
app.listen(port, localIp, () => {
    console.log(`Server running at http://${localIp}:${port}/`);
});