//express
const mongoose = require('mongoose');
const express = require('express')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient
// modules
const manageOrder = require('./pkg/manage-order')
const manageGroup = require('./pkg/manage-group')
const manageCron = require('./pkg/cron-jobs-node')
const session = require('express-session')

const app = express()

var connectionString='mongodb+srv://suryadi:belek005@cluster0.tqjdl.mongodb.net/iuranku?retryWrites=true&w=majority'

mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

const sessionMiddleware = session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false }
})

app.set('view engine', 'ejs')
app.set('trust proxy', 1 )
app.use(sessionMiddleware)
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
    app.use(manageCron(db))
    // error
    app.use(function (error, req, res, next) {
        console.error(error.stack)
        res.status(error.status || 500)
        if (error.status === 404) {
            res.render('pages/error404')
        } else {
            res.render('pages/error500', {
                error
            })
        }
    })
    
    // listen on port
    app.listen(3001, function() {
        console.log('listening on 3001')
    })
});
