const mongoose = require("mongoose");

const schema = mongoose.Schema({
    action:{
        type:String,
        required:true,
    },
    method:{
        type:String
    },
    amount:{
type:Number
    },
    id:{
        type:Number
    }
})

const BettingSchema = mongoose.model("Betting", schema);
module.exports=BettingSchema;
