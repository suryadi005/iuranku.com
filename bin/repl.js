require('dotenv').config()
const mongoose = require('mongoose');
const repl = require('repl');
const Group = require('../pkg/manage-group/models/group');
const Order = require('../pkg/manage-order/models/order');
const IncentiveWithdrawal = require('../pkg/manage-referral/models/incentive-withdrawal');
const Referral = require('../pkg/manage-referral/models/referral');
const User = require('../pkg/manage-user/models/user');

const connectionString = process.env.MONGODB_CONNECTION_STRING
mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.on('error', () => process.exit(1));

db.once('open', function() {
    console.log('Connected to Database')
    
    const r = repl.start('> ');

    Object.defineProperty(r.context, 'models', {
      configurable: false,
      enumerable: true,
      value: {
        Referral,
        IncentiveWithdrawal,
        Group,
        Order,
        User
      }
    });
});
