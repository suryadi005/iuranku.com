require('dotenv').config()
const mongoose = require('mongoose');
const Order = require('../pkg/manage-order/models/order');
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
        const orders = await Order.find({ userId: undefined })
        const result = await Promise.all(orders.map((order) => {
          return new Promise(async (resolveCreateUser, rejectCreateUser) => {
            const session = await db.startSession();
            try {
              session.startTransaction();
              const user = new User(order)
              await user.save({ session })
              order.userId = user.id
              await order.save({ session })
              await session.commitTransaction();
              resolveCreateUser()
            } catch (e) {
              await session.abortTransaction();
              rejectCreateUser()
            } finally {
              session.endSession()
            }
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
