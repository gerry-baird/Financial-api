const Joi = require('joi');
const express = require('express');
const winston = require('winston');
const router = express.Router();
const mongoose = require('mongoose');
const _ = require('lodash');


const budgetSchema = new mongoose.Schema({
    cc: {type: Number, required: true},
    allocated : {type: Number, required: true},
    requisitioned: {type: Number, required: true},
    delivered: {type: Number, required: true},
    invoiced: {type: Number, required: true},
    holderName: {type: String, required: true},
    holderEmail: {type: String, required: true}
  });

const Budget = mongoose.model('Budget', budgetSchema);

//JOI Validatio function
function validateBudget(budget) {
  const schema = {
    cc: Joi.number().integer().min(50).max(100000),
    allocated : Joi.number().integer().min(0).max(1000000),
    requisitioned: Joi.number().integer().min(0).max(1000000),
    delivered: Joi.number().integer().min(0).max(1000000),
    invoiced: Joi.number().integer().min(0).max(1000000),
    holderName : Joi.string().required(),
    holderEmail : Joi.string().email().required()
  };

  return Joi.validate(budget, schema);
}


//Create Budget Record
router.post('/', async(req,res, next) => {

  const { error } = validateBudget(req.body); 
  if (error) {
    const msg = error.details[0].message; //Get first error
    winston.error('Budget NOT created', msg);
    
    return res.status(400).send(msg);
  }
  let budget = new Budget({
    cc: parseInt(req.body.cc),
    allocated : parseInt(req.body.allocated),
    requisitioned: parseInt(req.body.requisitioned),
    delivered: parseInt(req.body.delivered),
    invoiced: parseInt(req.body.invoiced),
    holderName: req.body.holderName,
    holderEmail: req.body.holderEmail
  });

  budget = await budget.save();
  res.status(200).json(budget);
})

router.put('/:cc', async (req, res) => {
  const { error } = validateBudget(req.body); 
  if (error) {
    const msg = error.details[0].message; //Get first error
    winston.error('Budget NOT created', msg);
    
    return res.status(400).send(msg);
  }

  const cc = parseInt(req.params.cc);
  let budget = await Budget.findOne({cc: cc});
  winston.debug('PUT Budget ' + cc);
  winston.debug('Current Budget');
  winston.debug(budget);

  if (_.isEmpty(budget)) {
    winston.error('Budget could not be found : ' + cc);
    return res.status(404).send('The budget with the given cost center was not found.');
  }

  //Update fields ( NOT CC field, this is fixed)
  budget.allocated = parseInt(req.body.allocated);
  budget.requisitioned = parseInt(req.body.requisitioned);
  budget.delivered = parseInt(req.body.delivered);
  budget.invoiced = parseInt(req.body.invoiced)
  budget.holderName = req.body.holderName;
  budget.holderEmail = req.body.holderEmail;

  budget = await budget.save();

  winston.debug('Updated Budget');
  winston.debug(budget);
  res.send(budget);
});

//Get Budget
router.get('/:cc', async(req, res) => {
  const cc = parseInt(req.params.cc);
  const budget = await Budget.findOne({cc: cc});
  winston.debug('GET Budget ' + cc);
  winston.debug(budget);
  if (_.isEmpty(budget)) {
    winston.error('Budget could not be found : ' + cc);
    return res.status(404).send('The budget with the given cost center was not found.');
  }
 
  res.send(budget);
});

//Delete Budget
router.delete('/:cc', async(req, res) => {
  const cc = parseInt(req.params.cc);
  const budget = await Budget.find({cc: cc});

  if (!budget) return res.status(404).send('The budget with the given cost center was not found.');
  await Budget.deleteOne({cc: cc});
  res.send(budget);
});


module.exports = router;