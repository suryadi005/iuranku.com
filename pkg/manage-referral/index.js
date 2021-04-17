const Referral = require('./models/referral')
const getContinueUrl = require('../get-continue-url')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose');
const IncentiveWithdrawal = require('./models/incentive-withdrawal');

function manageReferral (db) {
    // index page
    router.get('/admin/referrals', async function(req, res) {
        const offset = parseInt(req.query.offset || '0')
        const limit = parseInt(req.query.limit || '20')
        const total = await Referral.countDocuments()
        const totalPages = Math.ceil(total/limit)
        const currentPage = (offset/limit) +1 
        const referrals = await Referral.find({}).sort({createdAt: 'desc'}).populate({
            path: 'incentiveWithdrawal',
            match: { updatedBy: null }
        }).skip(offset).limit(limit)

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

        if (await Referral.exists({ userId })) {
            res.redirect('/referral')
        }

        req.session.errorDaftarReferral = undefined
        req.session.save(function(err) { if (err) { console.warn(err) } })

        res.render('pages/referral/daftar', { errorDaftarReferral: errorDaftarReferral });
    });

    // show page
    router.get('/referral', async function(req, res, next) {
        try {
            const userId = req.session.userId
            const errorIncentiveWithdrawals = req.session.errorIncentiveWithdrawals

            if (!userId) {
                return res.redirect('/daftar?continue=' + req.originalUrl)
            }

            const referral = await Referral.findOne({ userId })
            
            if (!referral) {
                return res.redirect('/referrals/daftar?continue=' + req.originalUrl)
            }

            const incentiveWithdrawals = await IncentiveWithdrawal.find({ referralId: referral.id }).sort({createdAt: 'desc'}).limit(100)

            req.session.errorIncentiveWithdrawals = undefined

            res.render('pages/referral/show', {
                referral,
                incentiveWithdrawals,
                errorIncentiveWithdrawals
            });
        } catch(error) {
            next(error)
        }
    });

    // create referrals
    router.post('/referrals', async function(req, res) {
        try {
            const continueUrl = getContinueUrl(req.query)
            const referral = new Referral({
                ...req.body,
                userId: req.session.userId,
                code: req.body.code || mongoose.Types.ObjectId()
            })
            await referral.save()
            req.session.referralId = referral.id
            req.session.save(function(err) { if (err) { console.warn(err) } })
            if (continueUrl) {
                res.redirect(continueUrl)
            } else {
                res.redirect('/referral')
            }
        } catch (e) {
            console.error(e)
            if (e.code ===11000) {
                req.session.errorDaftarReferral = 'referral code telah digunakan'
            } else {
                req.session.errorDaftarReferral = 'Terjadi kesalahan, silahkan coba beberapa saat lagi.'
            }
            req.session.save(function(err) { if (err) { console.warn(err) } })
            res.redirect('/referrals/daftar')
        }
    });

    // create incentive-withdrawal
    router.post('/incentive-withdrawals', async function(req, res) {
        const session = await db.startSession();
        try {
            const userId = req.session.userId

            if (!userId) {
                throw new Error('unauthorized')
            }

            session.startTransaction();

            const referral = await Referral.findOne({ userId }).session(session)

            if (!referral) {
                throw new Error('referrer tidak ditemukan')
            }

            if (referral.incentive < 100000) {
                throw new Error('Pencairan bisa dilakukan apabila incentive lebih besar dari Rp 99,999')
            }

            const incentiveWithdrawal = new IncentiveWithdrawal({
                ...req.body,
                amount: referral.incentive,
                referralId: referral.id
            })
            referral.incentive = 0
            await referral.save({ session })
            await incentiveWithdrawal.save({ session })
            await session.commitTransaction();
            res.redirect('/referral')
        } catch (e) {
            console.error(e)
            await session.abortTransaction();
            if (e.code ===11000) {
                req.session.errorIncentiveWithdrawals = 'Permintaaan pencairan terakhir masih diproses'
            } else {
                req.session.errorIncentiveWithdrawals = e.message
            }
            req.session.save(function(err) { if (err) { console.warn(err) } })
            res.redirect('/referral')
        } finally {
            session.endSession();
        }
    });

    // update incentive-withdrawal
    router.patch('/incentive-withdrawals/:incentiveWithdrawalId', async function(req, res) {
        try {
            const userId = req.session.userId

            if (!userId) {
                throw new Error('unauthorized')
            }

            const referral = await Referral.findOne({ userId })

            if (!referral) {
                throw new Error('referrer tidak ditemukan')
            }

            const incentiveWithdrawal = await IncentiveWithdrawal.findOne({
                referralId: referral.id
            })
            incentiveWithdrawal.updatedBy = userId
            incentiveWithdrawal.updatedAt = Date.now()
            incentiveWithdrawal.status = req.body.status
            await incentiveWithdrawal.save()
            res.redirect('/admin/referrals')
        } catch (e) {
            console.error(e)
            req.session.errorIncentiveWithdrawals = e.message
            req.session.save(function(err) { if (err) { console.warn(err) } })
            res.redirect('/admin/referrals')
        }
    });

    // public page
    router.get('/:referralCode', async function(req, res, next) {
        if (req.session.referralId) {
            return res.redirect('/')
        }
    
        const referralCode = req.params.referralCode
        const referral = await Referral.findOne({ code: referralCode })

        if (!referral) {
            return next()
        }

        req.session.referralId = referral.id
        req.session.save(function(err) { if (err) { console.warn(err) } })
        res.redirect('/')
    });

    return router
}

module.exports = manageReferral
