const cron = require('node-cron');
const express = require('express')
const Group = require('../manage-group/models/group')
const Order = require('../manage-order/models/order')

const router = express.Router()

function manageCron (db) {
    cron.schedule('0 * * * *', async () => {
        try { 
            const date = new Date()
            const maxAgeMinute =  720 // 24 jam (1440 menit)
            date.setMinutes(date.getMinutes() - maxAgeMinute)
            const expiredOrderQuery = {
                status: 'menunggu_pembayaran',
                groupId : { $ne: null },
                createdAt: {
                    $lte: date 
                }
            }
            const orders = await Order.find(expiredOrderQuery)
            for(let order of orders){
                const group = await Group.findById(order.groupId)
                group.memberCount -= 1
                await group.save()
            }
            const deleteResult = await Order.deleteMany(expiredOrderQuery)
        } catch (e) {
            console.error(e)
        }
      });

    return router
}

module.exports = manageCron