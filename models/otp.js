var mongoose  =  require('mongoose');  
   
var loginOtpSchema = new mongoose.Schema({
    
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    otp:{
        type:String,
        required:true
    },
    is_verified:{
        type:Boolean,
        default: false
    },
    timestamp:{
        type:Date,
        default: Date.now,
        set: (timestamp) => new Date(timestamp),
        get: (timestamp) => timestamp.getTime(),
    }

});

module.exports = mongoose.model('Otp', loginOtpSchema);