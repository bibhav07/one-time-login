const bcrypt = require ('bcrypt');
const User = require('../models/userModel');
const OtpModel = require("../models/otp");
const jwt = require('jsonwebtoken');
const { validationResult }  = require('express-validator');
const {sendMail} = require('../helpers/mailer');
const { checkOtpIsExpired } = require('../helpers/otpValidate');

const registerUser = async(req, res)=>{

    try {
        
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({
                success:false,
                msg:'Errors',
                errors:errors.array()
            });    
        }

        const { name, email, mobile, password } = req.body;
        const isExists = await User.findOne({ email });
        if(isExists){
            return res.status(400).json({
                success:false,
                msg:'Email already Exists!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            name,
            email,
            mobile,
            password:hashedPassword,
            image:'image/'+req.file.filename
        });

        const userData = await user.save();
        
        return res.status(201).json({success:true, msg:'Registered Successfully!', user: userData});

    } catch (error) {
        return res.status(400).json({
            success:false,
            msg:error.message
        });
    }

}

const generateAccessToken = async(user) => {
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn:"2h" });
    return token;
}

const generateRefreshToken = async(user) => {
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn:"4h" });
    return token;
}

const generateOtp = async () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}


const loginUser = async (req, res) => {

    try{

        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({
                success:false,
                msg:'Errors',
                errors:errors.array()
            });    
        }

        const { email, password } = req.body;

        const userData = await User.findOne({ email:email });
        if(!userData){
            return res.status(401).json({success:false, msg:'Email and Password is Incorrect!' });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);
        if(!passwordMatch){
            return res.status(401).json({success:false, msg:'Email and Password is Incorrect!' });
        };


        const otpData = await OtpModel.findOne({
            user_id : userData._id
        });

        if(otpData && otpData.is_verified  != false){
            const isOtpExpired = await checkOtpIsExpired(otpData.timestamp);
            if(!isOtpExpired){
            const accessToken = await generateAccessToken ({user:userData });
            const refreshToken = await generateRefreshToken ({user:userData });

            return res.status(201).json({
                success:true, 
                otpSent:false,
                msg:'Login Successfully!', 
                user: userData,
                accessToken: accessToken,
                refreshToken: refreshToken,
                tokenType:'Bearer'
            });


            }   
        }


        const g_otp = await generateOtp();
        const cDate  = new Date();

        await OtpModel.findOneAndUpdate(
            {user_id: userData._id},
            {otp: g_otp, is_verified: false, timestamp:new Date(cDate.getTime())},
            {new: true, upsert: true, setDefaultsOnInsert: true}
        )

        const html = `<p>Hii, '${userData.name}' <br> Your login OTP is <b>'${g_otp}'</b> </p>`
        sendMail(userData.email, 'Login OTP', html)

        return res.status(201).json({
            success:true, 
            otpSent: true,
            user_id : userData._id,
            msg:'Login OTP has been sent to your mail!', 
        });


    } catch (error) {
        return res.status(400).json({
            success:false,
            msg:error.message
        });
    }

};

const verifyOtp = async (req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({
                success:false,
                msg:'Errors',
                errors:errors.array()
            });    
        };

       const {user_id, otp} = req.body;
       
       const otpData = await OtpModel.findOne({
        user_id,
        otp,
        is_verified:false
       });

       if(!otpData){
           return res.status(200).json({
               success:false,
               msg:'Wrong otp entered!'
           });
       }

       const isOtpExpired = await checkOtpIsExpired(otpData.timestamp);

       if(isOtpExpired){
        return res.status(200).json({
            success:false,
            msg:'Otp is expired!'
        });
       }

       await OtpModel.findByIdAndUpdate({_id: otpData._id},{
        $set: {
            is_verified: true
        }
       });

       const userData = await User.findOne({ _id: otpData.user_id });

       const accessToken = await generateAccessToken ({user:userData });
       const refreshToken = await generateRefreshToken ({user:userData });

       return res.status(201).json({
           success:true, 
           msg:'Login Successfully!', 
           user: userData,
           accessToken: accessToken,
           refreshToken: refreshToken,
           tokenType:'Bearer'
       });



    } catch (error) {

        return res.status(400).json({
            success:false,
            msg:error.message
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    verifyOtp
}