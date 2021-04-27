const cacheControl = require('express-cache-controller')
const midtransClient = require('midtrans-client');
const express = require('express')
const Group = require('./models/group')
const fakeGroups = require('./fake-groups')
const router = express.Router()

const LAYANAN_HARGA_MAP = {
    Netflix: 44000,
    Spotify: 20000,
    Youtube: 24600,
}

const LAYANAN_HARGA_ORIGINAL_MAP = {
    Netflix: 50000,
    Spotify: 25000,
    Youtube: 30000,
}

const FAKE_STARTS_FROM = {
    netflix: 114,
    spotify: 80,
    youtube: 33
}


const LAYANAN_MAX_MEMBER = {
    Netflix: 5,
    Spotify: 6,
    Youtube: 5
}

function manageGroup (db) {
    // Grub page
    router.get('/group', cacheControl({
        maxAge: 300 // 5 minutes
    }), async function(req, res) {
        const netflixGroups = await Group.find({layanan:'Netflix'}).limit(3).populate('orders').sort({createdAt: 'desc'})
        const spotifyGroups = await Group.find({layanan:'Spotify'}).limit(3).populate('orders').sort({createdAt: 'desc'})
        const youtubeGroups = await Group.find({layanan:'Youtube'}).limit(3).populate('orders').sort({createdAt: 'desc'})

        const netflixTotal = await Group.countDocuments({layanan: 'Netflix'}) + fakeGroups.netflix.length + FAKE_STARTS_FROM.netflix
        const spotifyTotal = await Group.countDocuments({layanan: 'Spotify'}) + fakeGroups.spotify.length + FAKE_STARTS_FROM.spotify
        const youtubeTotal = await Group.countDocuments({layanan: 'Youtube'}) + fakeGroups.youtube.length + FAKE_STARTS_FROM.youtube

        fakeGroups.netflix = fakeGroups.netflix.slice(netflixGroups.length, fakeGroups.netflix.length)
        fakeGroups.spotify = fakeGroups.spotify.slice(spotifyGroups.length, fakeGroups.spotify.length)
        fakeGroups.youtube = fakeGroups.youtube.slice(youtubeGroups.length, fakeGroups.youtube.length)

        res.render('pages/group', {
            netflixGroups: [...netflixGroups, ...fakeGroups.netflix],
            spotifyGroups: [...spotifyGroups, ...fakeGroups.spotify],
            youtubeGroups: [...youtubeGroups, ...fakeGroups.youtube],
            netflixTotal,
            spotifyTotal,
            youtubeTotal,
            LAYANAN_MAX_MEMBER
        });
    });

    // Grub page
    router.get('/groups/:groupId', async function(req, res, next) {
        try {
            const userId = req.session.userId
            const groupId = req.params.groupId
            const group = await Group.findById(groupId).populate('orders')
            if (!group) {
                const error = new Error("Not Found")
                error.status = 404
                return next(error)
            }
            const currentUserOrder = group.orders.find(function(order){
                return order.userId.toString() === userId
            }) 
            const expiredAt = new Date(currentUserOrder ? currentUserOrder.createdAt: undefined);

            let orderPaymentContext = undefined

            if (process.env.MINDTRANS_ENABLED === 'true' && currentUserOrder.status === 'menunggu_pembayaran') {
                const isProduction = process.env.NODE_ENV === 'production'
                // initialize snap client object
                let snap = new midtransClient.Snap({
                  isProduction : isProduction,
                  serverKey: process.env.MIDTRANS_SERVER_KEY,
                  clientKey: process.env.MIDTRANS_CLIENT_KEY,
                });
    
                let parameter = {
                  "transaction_details": {
                    "order_id": isProduction ? currentUserOrder.id : new Date().getTime(),
                    "gross_amount": LAYANAN_HARGA_MAP[currentUserOrder.layanan],
                  }, "credit_card":{
                    "secure" : true
                  }
                };

                // create snap transaction token
                const transactionToken = await snap.createTransactionToken(parameter)

                orderPaymentContext = {
                    token: transactionToken, 
                    clientKey: snap.apiConfig.clientKey,
                    snapJsSrc: process.env.MIDTRANS_SNAP_JS_SRC,
                    grossAmount: LAYANAN_HARGA_MAP[currentUserOrder.layanan]
                }
            }


            expiredAt.setHours(expiredAt.getHours() + 12);
            res.render('pages/group-status', {
                group,
                currentUserOrder,
                expiredAt,
                orderPaymentContext,
                grossAmount: LAYANAN_HARGA_MAP[currentUserOrder.layanan],
                originalGrossAmount: LAYANAN_HARGA_ORIGINAL_MAP[currentUserOrder.layanan],
            });
        }catch(error) {
            error.status = 404
            next(error)
        }
        
    });


    return router
}

module.exports = manageGroup
