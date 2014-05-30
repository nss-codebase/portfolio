/* jshint unused:false */

'use strict';

var projects = global.nss.db.collection('projects');
var fs = require('fs');
var path = require('path');
var Mongo = require('mongodb');
var _ = require('lodash');
var rimraf = require('rimraf');
var crypto = require('crypto');

class Project{
  static create(userId, fields, files, fn){
    var project = new Project();
    project._id = Mongo.ObjectID();
    project.title = fields.title[0].trim();
    project.description = fields.description[0].trim();
    project.tags = fields.tags[0].split(',').map(t=>t.toLowerCase()).map(t=>t.trim());
    project.git = fields.git[0].trim();
    project.app = fields.app[0].trim();
    project.date = new Date(fields.date[0]);
    project.userId = userId;
    project.order = 0;
    project.photos = [];
    project.processPhotos(files.photos);
    projects.save(project, ()=>fn(project));
  }

  update(obj, fn){
    this.title = obj.title.trim();
    this.description = obj.description.trim();
    this.tags = obj.tags.split(',').map(t=>t.toLowerCase()).map(t=>t.trim());
    this.git = obj.git.trim();
    this.app = obj.app.trim();
    this.date = new Date(obj.date);
    projects.save(this, ()=>fn());
  }

  processPhotos(photos){
    photos.forEach(p=>{
      if(p.size){
        var name = crypto.randomBytes(12).toString('hex') + path.extname(p.originalFilename).toLowerCase();
        var file = `/img/${this.userId}/${this._id}/${name}`;

        var photo = {};
        photo.name = name;
        photo.file = file;
        photo.size = p.size;
        photo.orig = p.originalFilename;
        photo.isPrimary = false;

        var userDir = `${__dirname}/../static/img/${this.userId}`;
        var projDir = `${userDir}/${this._id}`;
        var fullDir = `${projDir}/${name}`;

        if(!fs.existsSync(userDir)){fs.mkdirSync(userDir);}
        if(!fs.existsSync(projDir)){fs.mkdirSync(projDir);}

        fs.renameSync(p.path, fullDir);

        this.projDir = path.normalize(projDir);
        this.photos.push(photo);
      }
    });
  }

  isOwner(user){
    return user._id.toString() === this.userId.toString();
  }

  destroy(fn){
    projects.findAndRemove({_id:this._id}, ()=>{
      if(this.projDir){
        rimraf(this.projDir, fn);
      }else{
        fn();
      }
    });
  }

  addPhoto(photos, fn){
    this.processPhotos(photos);
    projects.save(this, ()=>fn());
  }

  delPhoto(name, fn){
    projects.update({_id:this._id}, {$pull:{photos:{name:name}}}, ()=>{
      fs.unlinkSync(`${this.projDir}/${name}`);
      fn();
    });
  }

  setPrimary(name, fn){
    projects.update({_id:this._id, 'photos.isPrimary':true}, {$set:{'photos.$.isPrimary':false}}, ()=>{
      projects.update({_id:this._id, 'photos.name':name}, {$set:{'photos.$.isPrimary':true}}, ()=>{
        fn();
      });
    });
  }

  move(direction, fn){
    direction = direction === 'up' ? 1 : -1;
    projects.update({_id:this._id}, {$set:{order:this.order+direction}}, fn);
  }

  static findAll(fn){
    projects.find({}, {sort:[['order', -1]]}).toArray((e,r)=>fn(r));
  }

  static findAllByUserId(userId, fn){
    projects.find({userId:userId}, {sort:[['order', -1]]}).toArray((e,r)=>{
      fn(r);
    });
  }

  static findById(projectId, fn){
    projectId = Mongo.ObjectID(projectId);
    projects.findOne({_id:projectId}, (e,p)=>{
      p = _.create(Project.prototype, p);
      fn(p);
    });
  }
}

module.exports = Project;
