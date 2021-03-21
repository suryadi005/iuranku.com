const express = require('express')
const Order = require('./models/order')
const Group = require('../manage-group/models/group')
const router = express.Router()

function manageOrder (db) {
    const ordersCollection = db.collection('orders')
    const groupsCollection = db.collection('groups')

    // ######################################################################################### //
    // PAGE //

    // index page
    router.get('/', function(req, res) {
        res.render('pages/index', {});
    });
    // provider page
    router.get('/provider', function(req, res) {
        res.render('pages/provider');
    });
    // service page
    router.get('/service', function(req, res) {
        res.render('pages/service');
    });
    // list harga page
    router.get('/listharga', function(req, res) {
        res.render('pages/listharga');
    });
    // daftar page
    router.get('/daftar', function(req, res) {
        res.render('pages/daftar');
    });
    // ########################################################################################## //

    // We normally abbreviate `request` to `req` and `response` to `res`.
    router.get('/', async (req, res, next) => {
        try {
            const orders = await Order.find({})
            res.render('pages/index.ejs',{ orders: orders })
        } catch (e) {
            console.error(e)
            next(e)
        }
    })

    // create
    router.post('/orders', async (req, res, next) => {
        const layanan = req.body.layanan
        try {
            // find or create non full group
            let group = await Group.findOne({
                layanan,
                memberCount: { $lt: 5 },
            })
            if (!group) {
                group = await Group.create({
                    layanan,
                    memberCount: 1
                })
            } else {
                group.memberCount += 1
                await group.save()
            }
            // get group.id
            const groupId = group.id
            // set req.body.groupId = groupId
            req.body.groupId = groupId

            // create order
            await ordersCollection.insertOne(req.body)
            res.redirect('/groups/id-group')
        } catch (e) {
            console.error(e)
            next(e)
        }
    })

    return router
}

module.exports = manageOrder
