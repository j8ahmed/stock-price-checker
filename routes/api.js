
/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let query = req.query;
      console.log(query);
      let stock = req.query.stock;
      let like  = req.query.like;
      //Check to see if the query is for one stock or two
      if(typeof stock != typeof []){
        console.log('Bring it in people! We are only dealing with one stock. This should be easy!!');
        stock = stock.toUpperCase();
        //Check if we need to update the likes for the stock
        if(!like){
          //We do not need to update the document find and present the stock
          MongoClient.connect(CONNECTION_STRING, function(err, db) {
              db.collection('stocks').findOne({stock: stock}, (err, result)=>{
              if(err) return console.log(err);
              
              // console.log(result);
              res.json({
                stockData: {
                  stock: result.stock,
                  price: result.price,
                  likes: result.likes
                }
              });
            }); 
          });
        }else{
          //We need to update the likes
          MongoClient.connect(CONNECTION_STRING, function(err, db) {

            db.collection('stocks').findOneAndUpdate({stock: stock}, { $inc: { likes: 1}}, {returnNewDocument: true},(err, result)=>{
              if(err) return console.log(err);
              
              console.log(result.value);
              res.json({
                stockData: {
                  stock: result.value.stock,
                  price: result.value.price,
                  likes: result.value.likes
                }
              });
            });
          });
        }
      }else{
        //We are dealing with two stock values
        console.log('Its an array everyone... Calm down, we just have to compare and present two stocks to the user.');
        let stock1 = stock[0].toUpperCase();
        let stock2 = stock[1].toUpperCase();
        
        //Check if we need to update the likes for both the stocks
        if(!like){
          MongoClient.connect(CONNECTION_STRING, function(err, db) {// 
              db.collection('stocks').find({ $or: [ {stock: stock1}, {stock: stock2} ]}).toArray((err, result)=>{//                  if(err) return console.log(err); //                  console.log(result)
                console.log(result);
                res.json({
                  stockData: [
                    { stock: result[0].stock, price: result[0].price, rel_likes: (result[0].likes - result[1].likes) },
                    { stock: result[1].stock, price: result[1].price, rel_likes: (result[1].likes - result[0].likes) }
                  ]
                });
              }); 
          });
        }else{
          MongoClient.connect(CONNECTION_STRING, function(err, db) {// 
              //find and update the likes for stock 1
              db.collection('stocks').update({ $or: [ {stock: stock1}, {stock: stock2} ]}, {$inc: {likes:1} }, {multi: true}, (err, result)=>{
                if(err) return console.log(err);
              });
              //find and update the likes for stock 2
              db.collection('stocks').find({ $or: [ {stock: stock1}, {stock: stock2} ]}).toArray((err, result)=>{
                if(err) return console.log(err);
                console.log(result);
                res.json({
                  stockData: [
                    { stock: result[0].stock, price: result[0].price, rel_likes: (result[0].likes - result[1].likes) },
                    { stock: result[1].stock, price: result[1].price, rel_likes: (result[1].likes - result[0].likes) }
                  ]
                });
                
              });
          });
        }
        
        
      }
    
    });
    

};