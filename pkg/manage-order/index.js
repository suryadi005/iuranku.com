const express = require('express')
const Order = require('./models/order')
const Group = require('../manage-group/models/group')
const router = express.Router()

function manageOrder (db) {

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
        const errorDaftar = req.session.errorDaftar;
        req.session.errorDaftar = undefined
        req.session.save(function(err) {})


        res.render('pages/daftar', {errorDaftar: errorDaftar});
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
        const session = await db.startSession();
        try {
            session.startTransaction();

            // find or create non full group
            let group = await Group.findOne({
                layanan,
                memberCount: { $lt: 5 },
            }).session(session)
            if (!group) {
                group = (await Group.create([{
                    layanan,
                    memberCount: 1
                }], { session }))[0]

            } else {
                group.memberCount += 1
                await group.save({session})
            }
            // get group.id
            const groupId = group.id
            // set req.body.groupId = groupId
            req.body.groupId = groupId


            // create order
            const order = new Order(req.body)
            await order.save({session})
            await session.commitTransaction();
            res.redirect(`/groups/${groupId}`)
        } catch (e) {
            console.error(e)
            await session.abortTransaction();
            if (e.code ===11000) {
                req.session.errorDaftar = 'Email telah digunakan'
            } else {
                req.session.errorDaftar = 'Terjadi kesalahan, silahkan coba beberapa saat lagi.'
            }
            req.session.save(function(err) {})
            
            res.redirect('/daftar')
        }
        session.endSession();
    })

    return router
}

module.exports = manageOrder
