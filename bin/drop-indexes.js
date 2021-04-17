require('dotenv').config()
const mongoose = require('mongoose');
const Group = require('../pkg/manage-group/models/group');
const Order = require('../pkg/manage-order/models/order');
const IncentiveWithdrawal = require('../pkg/manage-referral/models/incentive-withdrawal');
const Referral = require('../pkg/manage-referral/models/referral');
const User = require('../pkg/manage-user/models/user');

const connectionString = process.env.MONGODB_CONNECTION_STRING

mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

function main () {
  return new Promise((resolve, reject) => {
    db.on('error', console.error.bind(console, 'connection error:'));
    db.on('error', (err) => reject(err));
    
    db.once('open', async () => {
      try {
        console.log('Connected to Database')
        const models = [
          Referral,
          IncentiveWithdrawal,
          Group,
          Order,
          User
        ]
        const result = await Promise.all(models.map((model) => {
          return new Promise((res, rej) => {
            model.collection.dropIndexes((err, result) => {
              if (err) {
                res(err)
              } else {
                res(result)
              }
            })
          })
        }))
        resolve(result)
      } catch (err) {
        reject(result)
      }
    });
  })
}

main()
  .then((res) => {
    console.log(res)
  })
  .finally(async () => {
    await db.close()
    process.exit(0)
  })
