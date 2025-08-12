const mongoose = require('mongoose')
const { validate } = require('mongoose-validator')
const validator = require('validator')
const bcrypt = require('bcrypt')

const userSchema = mongoose.Schema( //name, email, password, confirm password, profilepic, bio, followers, following
    {
        name: 
        {
            type: String,
            required : [true, 'name is required']
        },
        mail: 
        {
            type: String,
            required : [true, 'gmail is required'],
            unique : true,
            lowercase : true,
            validate: [validator.isEmail, 'please enter proper mail']

        }
        ,
        bio:
        {
            type : String ,
            maxlength : 150,
            default: "Hi I've Joined Zync also"
            
        },
        profilePic: 
        {
            type: String 
        },
        password: 
        {
            type: String,
            minlength : 8,
            required: [true, 'Password is required'],
            select: false
        }
            ,
        confirmPassword : 
        {
            type: String,
            required: [true, 'Password confirmation is required'],
            validate: {
                    validator: function(val)
                    { return val === this.password},
                    message : "Password and confirm password dont match"
            }
        },

        followers :
        [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref : 'User'
            }
        ],
        following :
        [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref : 'User'
            }
        ], 
        passwordChangedAt: 
        {
            type: Date,
            default: undefined
        }
    }
)

userSchema.pre('save', async function(next)
{
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12); // Hash the password
        // this.passwordChangedAt = Date.now(); // Set the passwordChangedAt field

    }
    this.confirmPassword = undefined; // Remove confirmPassword field
           

  next();
})

// userSchema.method.matchPasswords = async (pswd, DBpswd) => 
//     {
//         return await bcrypt.compare(pswd, DBpswd, (err,result) => 
//         {
//             if(error) {throw(error)}
//             else
//              console.log(result)
//         })
//     } this function doesnt work and idk why 


userSchema.methods.isPasswordChanged = async function(JWTtimestamp) {
    if (this.passwordChangedAt) {
        const pswdTS = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTtimestamp < pswdTS; // true if password changed after token issue
    }
    return false; // No password change recorded
}





const User = mongoose.model('User', userSchema);

module.exports = User;