const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();


//setup the task to insert endpoints
router.post('/task', auth, async (req, res) => {
    // const task = new Task(req.body);

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task);

    } catch(e) {
        res.status(400).send(e);
    }
})

//setup the endpoint for reading or fetching all tasks 
//GET tasks? completed= true
//GET tasks ? limit=2&skip=3
router.get('/task', auth, async (req, res) => {
    
    const match = {};
    const sort = {};

        if(req.query.completed) {
            match.completed = req.query.completed === 'true'
        }

        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':');

            sort[parts[0]] = parts[1] === 'desc'? -1:1;
        }

    try {
        //const task = await Task.find({ owner: req.user._id});

        //(for fetching all tasks ceated by the user, it is slow if we has huge databse so use query string )await req.user.populate('tasks').execPopulate()

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();

        res.send(req.user.tasks);

    }catch (e) {
        res.status(505).send(e);
    }
})

//setup the endpoint for fetching a task by its id's
router.get('/task/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        //const task = await Task.findById(_id);

        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send();
        }

        res.send(task);
    }catch (e) {
        res.status(500).send(e);
    }
})

router.patch('/task/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['completed', 'description'];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({ error: 'Invalid update'});
    }

    try {

        //const task = await Task.findById(req.params.id);

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        updates.forEach((update) => {
            task[update] = req.body[update];
        })

        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true});

        if(!task){
            return res.status(404).send();
        }

        await task.save();

        res.send(task);
    } catch(e) {
        res.status(400).send(e);
    }
})

//Delete the Task BY id..
router.delete('/task/:id', auth, async (req, res) => {

    try{
        //const task = await Task.findByIdAndDelete(req.params.id);

        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id });

        if(!task){
            return res.status(404).send();
        }

        res.send(task);

    }catch(e) {
        res.status(500).send(e);
    }
})

module.exports = router;