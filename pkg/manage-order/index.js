const express = require('express')
const Order = require('./models/order')
const Group = require('../manage-group/models/group')
const getContinueUrl = require('../get-continue-url')
const updateReferralStats = require('../manage-referral/update-referral-stats')
const User = require('../manage-user/models/user')
const router = express.Router()


const MAX_MEMBER = {
    Netflix: 5,
    Spotify: 6,
    Youtube: 5,
}


function manageOrder (db) {

    // ######################################################################################### //
    // PAGE //
    //ADMIN
    router.get('/admin/orders/:orderId/update-status', async function(req, res) {
        const orderId = req.params.orderId
        const order = await Order.findById(orderId)
        res.render('pages/admin/update-order-status-form', { order: order })
    })

    router.get('/admin/orders', async function(req, res) {
        const offset = parseInt(req.query.offset || '0')
        const limit = parseInt(req.query.limit || '20')
        const total = await Order.countDocuments()
        const totalPages = Math.ceil(total/limit)
        const currentPage = (offset/limit) +1 
        const orders = await Order.find({}).sort({createdAt: 'desc'}).skip(offset).limit(limit)

        res.render('pages/admin/order-list',{ 
            orders: orders,
            offset: offset,
            total: total,
            limit: limit,
            totalPages: totalPages,
            currentPage: currentPage
        });
    })

    //order-saya-page
    router.get('/order-saya', async function(req, res) {
        let context = {
            user: undefined,
            orders: undefined
        }
        const userId = req.session.userId
        if (userId) {
            const user = await User.findById(userId)
            const orders = await Order.find({
                userId: userId
            })
            context = {
                user,
                orders
            }
        }
        
        console.log(req.session)
        res.render('pages/order-saya', context);
    })

     //user-host-info-page
     router.get('/user-host-info', function(req, res) {
        res.render('pages/user-host-info');
    })

    //privacy-page
    router.get('/privacy', function(req, res) {
        res.render('pages/privacy');
    })

       //contact-us-page
       router.get('/contact-us', function(req, res) {
        res.render('pages/contact-us');
    })

       //terms-page
       router.get('/terms', function(req, res) {
        res.render('pages/terms');
    })

    //faq-page
    router.get('/faq', function(req, res) {
        res.render('pages/faq');
    })

    //about-page
    router.get('/about', function(req, res) {
        res.render('pages/about');
    })

    // berhasil mengantri-regular
    router.get('/berhasil-mengantri-regular', function(req, res) {
        res.render('pages/berhasil-mengantri-regular');
    })

    // berhasil-daftar-host
    router.get('/berhasil-daftar-host', function(req, res) {
        res.render('pages/berhasil-daftar-host');
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
        const errorDaftar = req.session.errorDaftar
        const continueUrl = getContinueUrl(req.query)
        req.session.errorDaftar = undefined
        req.session.save(function(err) { console.warn(err) })

        res.render('pages/daftar', {
            errorDaftar: errorDaftar,
            continueUrl: continueUrl
        });
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

    //update status
    router.post('/orders/:orderId/update-status', async function (req, res, next) {
        const session = await db.startSession();

        try {
            session.startTransaction();
            
            const orderId = req.params.orderId
            const status = req.body.orderStatus
            const order = await Order.findById(orderId).session(session)
            const layananMaxMembers = MAX_MEMBER[order.layanan]
            order.status = status
            await order.save({session})
            if (status === 'menunggu_anggota' && order.typeMember === 'host') {
                // baca antrian dan jadikan anggota 
                let group = await Group.findById(order.groupId).session(session)
                if (!group){
                    group = (await Group.create([{
                        layanan: order.layanan,
                        memberCount: 1
                    }], { session }))[0]
        
                    order.groupId = group.id
                    await order.save({session})
                }

                if (group.memberCount < layananMaxMembers) {
                    const orders= await Order.find({groupId:null, layanan:order.layanan, typeMember: { $ne: 'host' }, status: { $ne: 'menunggu_pembayaran'}}).limit( layananMaxMembers - group.memberCount ).sort({createdAt: 'desc'}).session(session)
                    const result = await Order.updateMany({
                        _id: { $in: orders.map(order => order._id) }
                    }, {
                        groupId: group.id
                    }).session(session)
                    group.memberCount += result.n
                    await group.save({session})
                }
            }
            else if(status === 'menunggu_anggota' && order.typeMember === 'regular') {
                // find non full group
                const group = await Group.findOne({
                    layanan: order.layanan,
                    memberCount: { $lt: layananMaxMembers },
                }).session(session)
                if (group) {
                    group.memberCount += 1
                    await group.save({session})
                    order.groupId = group.id
                    await order.save({session})
                }
            }

            await session.commitTransaction();
            res.redirect(`/admin/orders/`)
        } catch (e) {
            await session.abortTransaction();
            console.error(e)
            next(e)
        } finally {
            session.endSession();
        }
        
    })

    //delete order
    router.delete('/orders/:orderId', async function (req, res, next) {
        const session = await db.startSession();

        try {
            session.startTransaction();

            const orderId = req.params.orderId
            const order = await Order.findById(orderId).session(session)
            const layananMaxMembers = MAX_MEMBER[order.layanan]
            await Order.deleteMany({_id: order.id}).session(session)
            // Host berhenti bubarkan group
            if (order.typeMember === 'host' && order.groupId) {
                const group = await Group.findById(order.groupId).session(session)
                await Order.updateMany({groupId: group.id}, {status: 'menunggu_anggota', groupId: null}).limit( layananMaxMembers - group.memberCount ).sort({createdAt: 'desc'}).session(session)
                await group.delete()
            }
            // baca antrian dan jadikan anggota 
            else if (order.groupId){
                const group = await Group.findById(order.groupId).session(session)
                if (group.memberCount <= layananMaxMembers) {
                    const orders= await Order.find({groupId:null, layanan:order.layanan, typeMember:{$ne: 'host'}, status: { $ne: 'menunggu_pembayaran'}}).limit( layananMaxMembers - group.memberCount ).sort({createdAt: 'desc'}).session(session)
                    const result = await Order.updateMany({
                        _id: { $in: orders.map(order => order._id) }
                    }, {
                        groupId: group.id
                    }).session(session)
                    group.memberCount += result.n - 1   
                    await group.save({session})
                }
            }
            await session.commitTransaction();
            res.redirect(`/admin/orders`)
        } catch (e) {
            await session.abortTransaction();
            console.error(e)
            next(e)
        } finally {
            session.endSession();
        }
        
    })

    // create
    router.post('/orders', async (req, res, next) => {
        const layanan = req.body.layanan
        const layananMaxMembers = MAX_MEMBER[layanan]
        const continueUrl = getContinueUrl(req.query)
        const session = await db.startSession();
        let user = await User.findOne({email: req.body.email}).session(session)
        if (!user) {
            user =  new User(req.body)
            await user.save({session})
        }
        req.body.userId = user.id
        try {
            let group;
            session.startTransaction();

            if (req.body.typeMember==="host") {
                const order = new Order(req.body)
                await order.save({session})

                await session.commitTransaction();

                if (req.session.referralId) {
                    await updateReferralStats(req.session.referralId, { orderHostId: order.id })
                    req.session.referralId = undefined
                    req.session.save(function(err) { console.warn(err) })
                }

                req.session.userId = user.id

                if (continueUrl) {
                    res.redirect(continueUrl)
                } else {
                    res.redirect(`/berhasil-daftar-host`)
                }
            } else {
                // find non full group
                group = await Group.findOne({
                    layanan,
                    memberCount: { $lt: layananMaxMembers },
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

                if (req.session.referralId) {
                    await updateReferralStats(req.session.referralId, { orderRegularId: order.id })
                    req.session.referralId = undefined
                    req.session.save(function(err) { console.warn(err) })
                }

                req.session.userId = user.id

                if (!groupId) {
                    if (continueUrl) {
                        return res.redirect(continueUrl)
                    } else {
                        return res.redirect(`/berhasil-mengantri-regular`)
                    }
                }
            }
            if (continueUrl) {
                res.redirect(continueUrl)
            } else {
                res.redirect(`/groups/${group.id}`)
            }   
        } catch (e) {
            console.error(e)
            await session.abortTransaction();
            if (e.code ===11000) {
                req.session.errorDaftar = 'Order dengan email yang kamu masukkan telah ada di proses menunggu pembayaran'
            } else {
                req.session.errorDaftar = 'Terjadi kesalahan, silahkan coba beberapa saat lagi.'
            }
            req.session.save(function(err) { console.warn(err) })
            if (continueUrl) {
                res.redirect('/daftar?continue=' + continueUrl.encodedFullPath)
            } else {
                res.redirect('/daftar')
            }
        } finally {
            session.endSession();
        }
    })

    return router
}

module.exports = manageOrder
