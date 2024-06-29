
const express = require('express');
const router = express();
router.use(express.json());

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination:function(req, file, cb){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            cb(null,path.join(__dirname,'../public/image'));
        }
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const fileFilter = (req,file,cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null,true)
    }
    else{
        cb(null,false)
    }
}

const upload = multer({
    storage:storage,
    fileFilter:fileFilter
});

const userController = require('../controllers/userController');
const { registerValidator, loginValidator, verifyOtpValidator } = require('../helpers/validation');

router.post ("/register",upload.single('image'), registerValidator, userController.registerUser);

router.post("/login", loginValidator, userController.loginUser);

router.post("/verify-otp", verifyOtpValidator, userController.verifyOtp);

module.exports = router;