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
        for (let i = 0; i < orders.length; i += 1) {
          const order = orders[i]
          const session = await db.startSession();
          try {
            session.startTransaction();
            let user = await User.findOne({ email: order.email })
            if (!user) {
              user = new User(order)
              await user.save({ session })
            }
            await Order.updateOne({ userId: undefined }, { $set: { userId: user.id  }})
            await session.commitTransaction();
            console.log({user, order})
          } catch (e) {
            await session.abortTransaction();
            reject(e)
          } finally {
            session.endSession()
          }
        }
        resolve({ success: true })
      } catch (err) {
        reject(err)
      }
    });
  })
}

main()
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.error(err)
  })
  .finally(async () => {
    await db.close()
    process.exit(0)
  })
