const checkOtpIsExpired = async (expiryDate) => {
    try {
        const nowDate = new Date();

        const difference_in_time = nowDate.getTime() - expiryDate;
        const difference_in_days = Math.floor(difference_in_time / (1000 * 3600 * 34))
        console.log('Expiry Days: -', difference_in_days);

        //if the last otp generated day and current day is more than 5, user need to generate new otp
        if(difference_in_days > 5){
            return true;
        };
        return false
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    checkOtpIsExpired
}