const Referral = require('./models/referral')

async function updateReferralStats (referralId, { orderRegularId, orderHostId }) {
  const referral = await Referral.findById(referralId)
  if (orderRegularId) {
    referral.orderRegularIds.push(orderRegularId)
  }

  if (orderHostId) {
    referral.orderHostIds.push(orderHostId)
  }

  await referral.save()
}

module.exports = updateReferralStats
