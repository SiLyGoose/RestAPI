const { default: mongoose } = require("mongoose");

const Port = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    PORT: {
        type: Number, default: 9925
    },
    active: {
        type: Boolean, default: false
    }
});

module.exports = mongoose.model('Port', Port);