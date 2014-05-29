'use strict';

var users = global.nss.db.collection('users');
var bcrypt = require('bcrypt');
var Mongo = require('mongodb');

class User{
  static login(obj, fn){
    users.findOne({email:obj.email}, (e,u)=>{
      if(u){
        var isMatch = bcrypt.compareSync(obj.password, u.password);
        if(isMatch){
          fn(u);
        }else{
          fn(null);
        }
      }else{
        fn(null);
      }
    });
  }

  static findByUserId(userId, fn){
    userId = Mongo.ObjectID(userId);
    users.findOne({_id:userId}, (e,u)=>fn(u));
  }
}

module.exports = User;
