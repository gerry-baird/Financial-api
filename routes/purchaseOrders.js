const Joi = require('joi');
const express = require('express');
const winston = require('winston');
const router = express.Router();
const mongoose = require('mongoose');
const morgan = require('morgan');
const _ = require('lodash');

const partSchema = new mongoose.Schema({
  partNumber: {type: String},
  description: {type: String},
  qty: {type: Number},
  vendor: {type: String},
  uom: {type: String},
  unitCost: {type: Number}
});

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {type: String, required: true},
    cc: {type: Number, required: true},
    cost : {type: Number, required: true},
    description: {type: String, required: true},
    vendor: {type: String, required: true},
    creatorName: {type: String, required: true},
    creatorEmail: {type: String, required: true},
    partsList: [partSchema]
  });



const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
const Part = mongoose.model('Part', partSchema);

const purchaseOrderCounterSchema = new mongoose.Schema({
  counter: {type: Number, required: true}
});

const PurchaseOrderCounter = mongoose.model('PurchaseOrderCounter', purchaseOrderCounterSchema);


//JOI Validation function
function validatePurchaseOrder(purchaseOrder) {
  const schema = {
    
    cc: Joi.number().integer().min(50).max(100000),
    cost: Joi.number().integer().min(0).max(1000000),
    description : Joi.string().required(),
    vendor : Joi.string().required(),
    creatorName : Joi.string().required(),
    creatorEmail : Joi.string().required(),
    partsList: Joi.array()
  };

  return Joi.validate(purchaseOrder, schema);
}

//Create Purchase Order
router.post('/', async(req,res, next) => {
  winston.debug("Create PO : ");
  console.log(JSON.stringify(req.body, null, 4));
  
  const { error } = validatePurchaseOrder(req.body);
   
  if (error) {
    const msg = error.details[0].message; //Get first error
    winston.error('Purchase Order NOT created');
    winston.error(msg);
    return res.status(400).send(msg);
  }

  //What is the current maximim PO ?
  let newPoNumber = "PO1000";
  let poCounter = null;

  //Do a find one, and if empty initialise.
  //If not increment and save, use the value in newPoNumber
  try{
    poCounter = await PurchaseOrderCounter.findOne();
    if (_.isEmpty(poCounter)) {
      winston.warn('PO Counter is empty');
      poCounter =  new PurchaseOrderCounter({counter : 1000}); 
      await poCounter.save();
    }
  }catch(ex){
    winston.error('Error getting PO Counter');
    winston.error(ex);
    res.status(500).send('Something went wromg');
  }
  poCounter.counter = poCounter.counter + 1;
  newPoNumber = "PO" + poCounter.counter;

  try{

    //let partsList = [];

    let partsList = req.body.partsList;
    if(_.isEmpty(partsList)){
      winston.warn('Creating PO with empty parts list');
    }

    let po = new PurchaseOrder({
      poNumber: newPoNumber,
      cc: parseInt(req.body.cc),
      cost : parseInt(req.body.cost),
      description : req.body.description,
      vendor: req.body.vendor,
      creatorName: req.body.creatorName,
      creatorEmail: req.body.creatorEmail,
      partsList: partsList
    });
  
    po = await po.save();
    poCounter = await poCounter.save();
    res.status(200).json(po);
  
  }catch(ex){
    winston.error('Error in PO Post');
    winston.error(ex);
    res.status(500).send('Something went wromg');
  }
})

//Get PO
router.get('/:poNumber', async(req, res) => {
  const poNumber  = req.params.poNumber;
  const purchaseOrder = await PurchaseOrder.findOne({poNumber: poNumber});
  winston.debug('GET PO ' + poNumber);
  winston.debug(purchaseOrder);
  if (_.isEmpty(purchaseOrder)) {
    winston.error('PurchaseOrder could not be found : ' + purchaseOrder);
    return res.status(404).send('The PO with the given PO Number was not found.');
  }
 
  res.send(purchaseOrder);
});


module.exports = router;