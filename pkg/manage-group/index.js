const express = require('express')
const Group = require('./models/group')
const router = express.Router()

function manageGroup (db) {
    const groupsCollection = db.collection('groups')

    // Grub page
    router.get('/group', async function(req, res) {
        const groups = await Group.find().populate('orders')
        res.render('pages/group', {
            groups
        });
    });

    // Grub page
    router.get('/groups/:groupId', async function(req, res, next) {
        try {
            const groupId = req.params.groupId
            const group = await Group.findById(groupId).populate('orders')
            if (!group) {
                const error = new Error("Not Found")
                error.status = 404
                return next(error)
            }
            res.render('pages/group-status', {
                group
            });
        }catch(error) {
            error.status = 404
            next(error)
        }
        
    });


    return router
}

module.exports = manageGroup
