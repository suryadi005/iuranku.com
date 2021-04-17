const Referral = require('./models/referral')
const getContinueUrl = require('../get-continue-url')
const express = require('express')
const router = express.Router()

function manageReferral (db) {
    // index page
    router.get('/referrals', async function(req, res) {
        const offset = parseInt(req.query.offset || '0')
        const limit = parseInt(req.query.limit || '20')
        const total = await Referral.countDocuments()
        const totalPages = Math.ceil(total/limit)
        const currentPage = (offset/limit) +1 
        const referrals = await Referral.find({}).sort({createdAt: 'desc'}).skip(offset).limit(limit)

        res.render('pages/admin/referral-list',{ 
            referrals: referrals,
            offset: offset,
            total: total,
            limit: limit,
            totalPages: totalPages,
            currentPage: currentPage
        });
    });

    // register as referral page
    router.get('/referrals/daftar', async function(req, res) {
        const userId = req.session.userId
        const errorDaftarReferral = req.session.errorDaftarReferral

        if (!userId) {
            return res.redirect('/daftar?continue=' + req.originalUrl)
        }

        req.session.errorDaftarReferral = undefined
        req.session.save(function(err) {})

        res.render('pages/referral/daftar', { errorDaftarReferral: errorDaftarReferral });
    });

    // show page
    router.get('/referral', async function(req, res) {
        try {
            const userId = req.session.userId

            if (!userId) {
                return res.redirect('/daftar?continue=' + req.originalUrl)
            }

            const referralId = req.session.referralId
            const referral = await Referral.findById(referralId)

            if (!referral) {
                return res.redirect('/referrals/daftar?continue=' + req.originalUrl)
            }

            res.render('pages/referral/show', {
                referral,
            });
        } catch(error) {
            next(error)
        }
    });

    // create
    router.post('/referrals', async function(req, res) {
        try {
            // create referral
            const continueUrl = getContinueUrl(req.query)
            const referral = new Referral(req.body)
            await referral.save()
            req.session.referralId = referral.id
            req.session.save(function(err) {
                if (err) { console.warn('save session error') }
                if (continueUrl) {
                    res.redirect(continueUrl)
                } else {
                    res.redirect('/referral')
                }
            })
        } catch (e) {
            if (e.code ===11000) {
                req.session.errorDaftarReferral = 'referral code telah digunakan'
            } else {
                req.session.errorDaftarReferral = 'Terjadi kesalahan, silahkan coba beberapa saat lagi.'
            }
            req.session.save(function(err) {
                if (err) { console.warn('save session error') }
                res.redirect('/referrals/daftar')
            })
        } finally {
            session.endSession();
        }
    });

    // public page
    router.get('/:referralCode', async function(req, res) {
        const referralCode = req.params.referralCode
        const referral = await Referral.findOne({ code: referralCode })

        if (!referral) {
            return res.redirect('/')
        }

        req.session.referralId = referral.id
        req.session.save(function(err) {
            if (err) { console.warn('save session error') }
            res.redirect('/')
        })
    });

    return router
}

module.exports = manageReferral
