const express = require('express');
const morgan = require('morgan');
const winston = require('winston');
const mongoose = require('mongoose');

const budget = require('./routes/budget');
const purchaseOrders = require('./routes/purchaseOrders');

//Create Express App
const app = express();

//Use Morgan for HTTP instrumentation 
app.use(morgan('common'));

winston.level = 'debug';
const console = new winston.transports.Console();
winston.add(console);

//Configure express for JSON parsing
app.use(express.json());


const uri = "mongodb://gerry:floppy@cluster0-shard-00-00-zyrd1.mongodb.net:27017,cluster0-shard-00-01-zyrd1.mongodb.net:27017,cluster0-shard-00-02-zyrd1.mongodb.net:27017/financial?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";

mongoose.connect(uri, { useNewUrlParser: true })
  .then(() => console.log('I am connected to Mongo'))
  .catch(err => {
    winston.error('FATAL ERROR: Could not connect to Mongo');
    process.exit(1);
  });

//Add Budget API into express routes
app.use('/api/budget', budget);

//Add PO API into express routes
app.use('/api/purchaseOrders', purchaseOrders);

//default get
app.get('/', (req,res) => res.send('API is up'));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  winston.info('Budget API running on port 3000');
});