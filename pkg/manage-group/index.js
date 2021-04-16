const express = require('express')
const Group = require('./models/group')
const router = express.Router()

function manageGroup (db) {
    // Grub page
    router.get('/group', async function(req, res) {
        const netflixGroups = await Group.find({layanan:'Netflix'}).limit(3).populate('orders')
        const spotifyGroups = await Group.find({layanan:'Spotify'}).limit(3).populate('orders')
        const youtubeGroups = await Group.find({layanan:'Youtube'}).limit(3).populate('orders')

        const netflixTotal = await Group.countDocuments({layanan: 'Netflix'})
        const spotifyTotal = await Group.countDocuments({layanan: 'Spotify'})
        const YoutubeTotal = await Group.countDocuments({layanan: 'Youtube'})

        res.render('pages/group', {
            netflixGroups,
            spotifyGroups,
            youtubeGroups,
            netflixTotal,
            spotifyTotal,
            YoutubeTotal,
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
