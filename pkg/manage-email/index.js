
const express = require('express')  
const sendSampleEmail = require('./emails/sample')
const sendWelcomeEmail = require('./emails/welcome')
const router = express.Router()

function manageEmail (db) {
    router.get('/test-email', async function(req, res) {
        var context = {
            meatballCount: 7878
          };
        sendSampleEmail(context, function() {
            res.send('berhasil')
        }, function(e) {
            res.send(e.message)
        })
    })
    router.get('/test-welcome-email', async function(req, res) {
        var context = {
            order: {
                namaDepan: 'dedek',
                namaBelakang: 'suryadi',
                email: 'suryadi.skom05@gmail.com'
            },
            assetUrl: res.locals.assetUrl
          };
        sendWelcomeEmail(context, function() {
            res.send('berhasil')
        }, function(e) {
            res.send(e.message)
        })
    })
    return router
}


module.exports = manageEmail