const express = require('express')
const router = express.Router()


function manageSeo (db) {

    // ######################################################################################### //
    // PAGE //
    //ADMIN
    router.get('/robots.txt', async function(req, res) {
        res.render('pages/robots-txt', { })
    })

    return router
}

module.exports = manageSeo
