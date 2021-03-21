const express = require('express')

const router = express.Router()

function manageGroup (db) {
    const groupsCollection = db.collection('groups')

    // Grub page
    router.get('/groups', function(req, res) {
        res.render('pages/group');
    });

    // Grub page
    router.get('/groups/:groupId', function(req, res) {
        res.render('pages/group-status');
    });

    return router
}

module.exports = manageGroup
