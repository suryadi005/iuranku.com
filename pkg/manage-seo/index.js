const express = require('express')
const router = express.Router()


function manageSeo (db) {

    // ######################################################################################### //
    // PAGE //
    //ADMIN
    router.get('/robots.txt', async function(req, res) {
        res.render('pages/robots-txt', { })
    })

    router.get('/sitemap', async function(req, res) {
        res.set('Content-Type', 'text/xml')
        res.render('pages/sitemap',{})
    })

    return router
}

module.exports = manageSeo
