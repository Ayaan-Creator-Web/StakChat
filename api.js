const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const mysql = require('mysql2');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

const databaseName = 'sql12788940';
const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    port: 3306,
    user: 'sql12788940',
    password: 'rupk6Awivg',
    database: databaseName
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});
app.get('/', (req, res) => {
    res.send('API is working');
});

app.get('/messages/:user1/:user2', (req, res) => {
    const { user1, user2 } = req.params;
    const query = `
        SELECT * FROM messages
        WHERE (fromPerson = ? AND toPerson = ?)
           OR (fromPerson = ? AND toPerson = ?);
    `;
    db.query(query, [user1, user2, user2, user1], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

app.get('/users/:username', (req, res) => {
    db.query('SELECT * FROM users WHERE name != ?', [req.params.username], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

app.post('/messages', (req, res) => {
    const { fromPerson, toPerson, msg, time, date } = req.body;

    if (!fromPerson || fromPerson.trim() === '' ||
        !toPerson || toPerson.trim() === '' ||
        !msg || msg.trim() === '' ||
        !time || time.trim() === '' ||
        !date || date.trim() === '') {
        console.error('Validation Error: Missing or empty required message fields.');
        return res.status(400).json({ message: 'All message fields (fromPerson, toPerson, msg, time, date) are required and cannot be empty.' });
    }

    db.query('INSERT INTO messages (fromPerson, toPerson, msg, time, date) VALUES (?, ?, ?, ?, ?)',
        [fromPerson, toPerson, msg, time, date],
        (err, result) => {
            if (err) {
                console.error('Database Error: Error inserting message:', err);
                if (err.code === 'ER_NO_DEFAULT_FOR_FIELD' || err.code === 'ER_BAD_NULL_ERROR') {
                    return res.status(400).json({ message: 'Database constraint violation: A required field for message is missing or null.', error: err.message });
                }
                return res.status(500).json({ message: 'Failed to send message due to an internal server error.', error: err.message });
            }
            res.status(201).json({ message: 'Message sent successfully', insertId: result.insertId });
        }
    );
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}... awaiting MySQL connection`);
});