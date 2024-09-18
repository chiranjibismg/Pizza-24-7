//factory pattern
// all logic of the routes are kept in controller


const User = require('../../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport')

function authController(){
    const _getRedirectUrl=(req)=>{
        return req.user.role === 'admin' ?  '/admin/orders' : '/customers/orders'

    }

    return{
        login(req,res){
            res.render('auth/login')
        },
        postLogin(req, res, next) {
            const { email, password }   = req.body
           // Validate request 
            if(!email || !password) {
                req.flash('error', 'All fields are required')
                return res.redirect('/login')
            }
            passport.authenticate('local', (err, user, info) => {
                if(err) {
                    req.flash('error', info.message )
                    return next(err)
                }
                if(!user) {
                    req.flash('error', info.message )
                    return res.redirect('/login')
                }
                req.logIn(user, (err) => {
                    if(err) {
                        req.flash('error', info.message ) 
                        return next(err)
                    }

                    return res.redirect(_getRedirectUrl(req))
                })
            })(req, res, next)
        },

        register(req,res){
            res.render('auth/register')
        }
        ,
         async postRegister(req,res){
            const { name, email, password }   = req.body
            

            //check all fields
            if(!name || !email || !password) {
                req.flash('error', 'All fields are required')
                req.flash('name', name)
                req.flash('email', email)
               return res.redirect('/register')
            }

            //check existing email
            const findUser = await User.findOne({email})
            if(findUser){
                 req.flash("error", "Already Registred..!!")
                 return res.redirect("/register")
            }
            
            //password hash

            const hashedPassword = await bcrypt.hash(password, 10)

            // //create new user

            const user = new User({
                name,
                email,
                password: hashedPassword
            })

            user.save().then((user) => {
                // Login
               
                return res.redirect('/')
             }).catch(err => {
                req.flash('error', 'Something went wrong')
                    return res.redirect('/register')
             })
        },

        logout(req, res) { // updated. earlier one got depreciated
            req.logout(function(err) {
              if (err) {
                console.error(err);
                return res.status(500).send('Error logging out');
              }
              res.redirect('/login'); 
            });
        }
    }


}

module.exports= authController