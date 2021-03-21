//express
const mongoose = require('mongoose');
const express = require('express')
const bodyParser= require('body-parser')
const app = express()
const MongoClient = require('mongodb').MongoClient
// modules
const manageOrder = require('./pkg/manage-order')
const manageGroup = require('./pkg/manage-group')

var connectionString='mongodb+srv://suryadi:belek005@cluster0.tqjdl.mongodb.net/iuranku?retryWrites=true&w=majority'


mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

// set the view engine to ejs
app.set('view engine', 'ejs');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to Database')

    // load modules
    app.use(manageOrder(db))
    app.use(manageGroup(db))

    // listen on port
    app.listen(3001, function() {
        console.log('listening on 3001')
    })
});
