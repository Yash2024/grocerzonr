const mongoose = require('mongoose');

const orderSchema = {
    _id: mongoose.Schema.Types.ObjectId,
    chat_id: {type: String},
    orderlist: { type: [Number], required: true }
}


module.exports = mongoose.model('Order', orderSchema);