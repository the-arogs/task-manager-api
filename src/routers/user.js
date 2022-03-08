const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcEmail, sendExitMail } = require('../emails/account')



router.post('/users', async (req, res) => {
    const user = new User(req.body)

// Async/Await

    try{
        await  user.save()
        sendWelcEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }

// Promise chain

    // user.save().then(() => {
    //     res.status(201).send(user)
    // }).catch((e) => {
    //     res.status(400).send(e)
    // })
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send( {user, token})

    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
  
    res.send(req.user)
    

    // User.find({}).then((users) => {
    //     res.send(users)
    // }).catch((e) => {
    //     res.status(500).send()
    // })
})



router.patch('/users/me', auth, async (req, res) => {
    const _id = req.user._id
    const allowedUpdates = ['name', 'email', 'age', 'password']
    const updates = Object.keys(req.body)
    const isValid = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValid) {
        return res.status(400).send({ error: 'Invalid Updates'})
    }

    try {
   

        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.delete('/users/me', auth , async (req, res) => {
    const _id = req.params.id;
    try {
        const user = await User.findByIdAndDelete(req.user._id)
        if (!user) {
            return res.status(404).send()
        }
        await req.user.remove()
        sendExitMail(user.email, user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

const upload = multer({
 
    limits: {
        fileSize: 1024000
    },
    fileFilter( req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/gi)) {
            return cb(new Error('File must be in .jpeg,jpg or png format'))  
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
   const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
   
   
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.get('/users/:id/avatar', async (req, res) => {
    
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar) {
        throw new Error()
    }
    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
}, (error, req, res, next) => {
    res.status(400).send()
})



module.exports = router