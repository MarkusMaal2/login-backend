const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const app = express();

app.use(cors());        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

const widgets = [
    { id: 1, name: "Cizzbor", price: 29.99 },
    { id: 2, name: "Woowo", price: 26.99 },
    { id: 3, name: "Crazlinger", price: 59.99 },
]

const salt = "#ALLLL24"

let users = [
]

app.get('/users', (req, res) => {
    res.send(users);
})

app.get('/users/:id', (req, res) => {
    if (typeof users[req.params.id - 1] === 'undefined') {
        return res.status(404).send({ error: "User not found" })
    }
    res.send(users[req.params.id - 1])
})

app.post('/users', (req, res) => {
    console.log(req.body.length);
    if (!req.body.name || !req.body.password) {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    users.push({
        id: users.length + 1,
        name: req.body.name,
        hash: createHash('sha256').update(req.body.name  + salt + req.body.password).digest('hex')
    })
    res.send(users[users.length - 1])
})

app.delete('/users/:id', (req, res) => {
    if (typeof users[req.params.id - 1] === 'undefined') {
        return res.status(404).send({ error: "User not found" })
    }
    users.splice(req.params.id-1, 1);
    res.status(204).send({error: "No content"});
})

app.listen(8080, () => {
    console.log(`Testing API up at: http://localhost:8080`)
})