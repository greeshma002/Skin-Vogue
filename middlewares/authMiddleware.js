const userModel = require("../models/UserSchema");

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

async function isBlocked(req, res, next) {

    if (!req.session.userDoc.isBlocked) {
        let user=await userModel.findOne({email:req.session.user})
       
        if(user.isBlocked){
            req.session.destroy()
            return res.redirect('/login');
        }else{

            next();
        }
    } else {
        res.redirect('/login');
    }
}

function isAdmin(req,res,next) {
    if(req.session.admin) {
        next();
    } else {
        res.redirect("/admin/login")
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin) {
            res.redirect('/admin/dashboard');
        }
        else{
            next();
        }
        

    } catch (error) {
        console.log(error.message)
    }
}



module.exports = {isAuthenticated, isBlocked , isAdmin , isLogout};