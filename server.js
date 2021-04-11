require('dotenv').config()
//express
const mongoose = require('mongoose');
const express = require('express')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient
const basicAuth = require('express-basic-auth')
// modules
const manageOrder = require('./pkg/manage-order')
const manageGroup = require('./pkg/manage-group')
const manageCron = require('./pkg/cron-jobs-node')
const session = require('express-session')
const path = require('path');

const app = express()

var connectionString = process.env.MONGODB_CONNECTION_STRING

mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

const sessionMiddleware = session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false }
})
const basicAuthMiddleware = basicAuth({
    challenge: true,
    users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD }
})

app.set('view engine', 'ejs')
app.set('trust proxy', 1 )
app.use('/admin', basicAuthMiddleware)
app.use(express.static(path.join(__dirname, 'public')))
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
    //Not found
    app.use(function ( req, res, next) {
        res.render('pages/error404')
    })
    // error
    app.use(function (error, req, res, next) {
        console.error(error.stack)
        res.status(error.status || 500)
        console.log({error})
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
