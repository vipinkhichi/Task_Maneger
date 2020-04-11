const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

//definig a sechema is because so that we can use the middleware of mongoose
const userSchema = new mongoose.Schema({
    name : {
        type:String,
        required: true,
        trim: true
    }, 
    email : {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contains "password"');
            }
        }
    },
    age: {
        type:Number,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error('Age must be positive.')
            }
        }
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {

    user =this;
    userObject = user.toObject();

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject;
} 

//As generateAuthToken is instance method not schema so use methods instead of statics
userSchema.methods.generateAuthToken = async function () {
    const user=this;

    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);

    user.tokens =user.tokens.concat( { token });
    await user.save();

    return token;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if(!user){
        throw new Error('Unable to login..')
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('Unabke to login..')
    }

    return user;
}


// Hash the password use of normal function because of arrow function cannot bind this
userSchema.pre('save', async function (next) {
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }

    //call to next is importtant because of return to this function when save completed if not next called then program hangs...
    next();
})

//Delet user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();
})


const User = mongoose.model('User', userSchema);

module.exports = User;


//Create Instances for the model...
// const me = new User({
//     name: '   Vipin ',
//     email: 'kumarvipin2502@gmail.com',
//     password:'Vipin@98'
// })

//And finally save the instance in the database
// me.save().then(() => {
//     console.log(me);
// }).catch((error) => {
//     console.log('Error', error);
// })
