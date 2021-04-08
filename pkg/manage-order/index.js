const express = require('express')
const Order = require('./models/order')
const Group = require('../manage-group/models/group')
const router = express.Router()

function manageOrder (db) {

    // ######################################################################################### //
    // PAGE //

    // berhasil mengantri
    router.get('/pages/berhasilMengantri', function(req, res) {
        res.render('pages/berhasilMengantri');
    })

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
            let group;
            session.startTransaction();

            if (req.body.typeMember==="host") {
                group = (await Group.create([{
                    layanan,
                    memberCount: 1
                }], { session }))[0]
                const orders= await Order.find({groupId:null}).limit(4).session(session)
                const result = await Order.updateMany({
                    _id: { $in: orders.map(order => order._id) }
                }, {
                    status:'menunggu_pembayaran',
                    groupId: group.id
                }).session(session)
                group.memberCount += result.n
                await group.save({session})

                console.log({result})

                // create order
                req.body.groupId = group.id
                const order = new Order(req.body)
                await order.save({session})

                await session.commitTransaction();
            } else {
                // find or create non full group
                group = await Group.findOne({
                    layanan,
                    memberCount: { $lt: 5 },
                }).session(session)
                if (group) {
                    group.memberCount += 1
                    await group.save({session})
                }
                // get group.id
                const groupId =  group ? group.id : null
                // set req.body.groupId = groupId
                req.body.groupId = groupId


                // create order
                const order = new Order(req.body)
                await order.save({session})
                
                await session.commitTransaction();

                if (!groupId) {
                    return res.redirect(`/berhasilMengantri`)
                }
            }

            res.redirect(`/groups/${group.id}`)
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
