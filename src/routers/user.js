const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('..//middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const router = new express.Router();


router.post('/users', async (req, res) => {
    const user =new User(req.body);

    //the promise if unfullfilled in middle than than the next lines of code not run so we use the try catch block
    try {
        await user.save();
        
        sendWelcomeEmail(user.email, user.name)
 
        const token = await user.generateAuthToken();

        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        //As notice below we user instead of User as every user have its own token of array
        const token = await user.generateAuthToken();

        res.send({user, token});

    }catch(e) {
    
        res.status(404).send();
    }

})

router.post('/users/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;

        })

        await req.user.save(); 
        res.send();

    } catch (e) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    
    try {
        req.user.tokens = [];

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

//Fatch more than one Users no longer to use to change read profile
router.get('/users/me', auth, async (req, res) => {
    
    res.send(req.user);

    // try {
    //     const users= await User.find({  });
    //     res.status(200).send(users);

    // } catch(e) {
    //     res.status(500).send(e);
    // }
    
})

//Fatch one user by using id..
router.get('/users/:id', async(req, res) => {
    //mongoose automatcally converts string id's into object id's
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);

        if(!user){
           return  res.status(404).send();
        }
        res.send(user);

    } catch (e) {
        res.status(500).send(e);
    }
})

//Update the user account data we dont delete by id because we cane acess to only us
router.patch('/users/me', auth, async (req, res) => {
    
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age']
    
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({ error: 'Invalid Updates!'})
    }

    //const _id = req.params.id;
    try {

        //const user = await User.findById(req.params.id);
        
        const user = req.user;

        updates.forEach((update) => {
            user[update] = req.body[update];
        })

        //middleware get executed here and for save the task
        await user.save();

        //We are trying to acess the data provide by user by request req.body for making our app more general
        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });

        //It can be removed because they just logged in
        // if(!user){
        //     return res.status(404).send();
        // }

        res.send(user);

    } catch (e) {
        //Error may be beacause of validating and the cannot connect to databse
        res.status(400).send(e);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        // const user = await User.findByIdAndDelete(req.user._id);

        // if(!user){
        //     return res.status(404).send();
        // }

        await req.user.remove();
        sendCancelationEmail(ureq.user.email, req.user.name);

        res.send(req.user);
    }catch(e) {
        res.status(500).send(e);
    }
 })

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Plaese upload a image'));
        }

        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer();
    
    req.user.avatar = buffer;
    await req.user.save();

    res.send();

}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

router.delete('/users/me/avatar', auth, async (req, res) => {
        req.user.avatar = undefined;

        await req.user.save();
        res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar);

    } catch (e) {
        res.status(400).send();
    }
})

module.exports = router