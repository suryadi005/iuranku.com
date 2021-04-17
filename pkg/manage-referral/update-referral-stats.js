const Referral = require('./models/referral')

async function updateReferralStats (referralId, { orderRegularId, orderHostId }) {
  const session = await db.startSession();

  try {
    session.startTransaction();
    const referral = await Referral.findById(referralId).session(session)
    if (orderRegularId) {
      referral.orderRegularIds.push(orderRegularId)
    }
  
    if (orderHostId) {
      referral.orderHostIds.push(orderHostId)
    }
  
    await referral.save({ session })
  } catch (e) {
    await session.abortTransaction();
    console.warn(e)
  } finally {
    session.endSession();
  }
}

module.exports = updateReferralStats
