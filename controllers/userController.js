const bcrypt = require ('bcrypt');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { validationResult }  = require('express-validator');

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
        }

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
    loginUser
}