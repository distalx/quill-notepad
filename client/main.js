import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {Random} from 'meteor/random';
import {_} from 'lodash';

import './main.html';


import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';


import Quill from 'quill';

const Delta = Quill.import('delta');

import {Users} from '/imports/api/users';
import {Ops} from "/imports/api/ops";
import {Meteor} from "meteor/meteor";

Template.registerHelper('instance', () => Template.instance());


Template.notepad.onCreated(function () {

  let instance = this;
  instance.quill = new ReactiveVar();
  instance.fin_delta = new ReactiveVar(new Delta());

  _.extend(instance, {
    init() {
      localStorage.setItem('user_id', localStorage.getItem('user_id') || Random.id());
      let user_id = localStorage.getItem('user_id');
      if (!Users.findOne({_id: user_id})) {
        Users.insert({_id: user_id, name: 'User Unknown'}, function (err) {
          if (err) {
            console.log('init ', err.reason);
          }
        });
      }

      instance.user_id = user_id;
    },
    get_user() {
      return Users.findOne(instance.user_id);
    },

  })

  Meteor.setTimeout(() => {
    instance.init();
  }, 300)


  instance.autorun(() => {
    const ops = Ops.find({'notepad_id': 'landing'}).fetch();
    const delta_ops = ops.map((item) => new Delta(item.ops))

    const fin_delta = delta_ops.reduce(function (accumulator, currentValue, currentIndex, array) {
      return accumulator.concat(currentValue)
    }, new Delta())

    instance.fin_delta.set(fin_delta)
  });


});


Template.notepad.onRendered(function () {
  const instance = this;
  instance.change = new Delta();
  instance.editor = document.getElementById('editor');
  instance.quill = new Quill(instance.editor, {
    modules: {
      toolbar: [
        [{header: [1, 2, false]}],
        ['bold', 'italic', 'underline'],
      ]
    },
    placeholder: 'Compose an epic...',
    theme: 'snow' // or 'bubble'
  });


  instance.autorun(() => {
    instance.quill.setContents(instance.fin_delta.get());
  });

  instance.quill.on('text-change', function (delta, oldDelta, source) {
    if (source == 'user') {
      const data = {
        user_id: instance.user_id,
        notepad_id: 'landing',
        ...delta
      }
      Ops.insert(data);
    }
  });


});

Template.notepad.helpers({
  users() {
    return Users.find();
  },
});

Template.notepad.events({
  'keyup .user-input'(e, instance) {
    const name = e.target.value;
    Users.update(instance.user_id, {$set: {name}}, {upsert: true});
  },
  'click #clear-all'(e, instance) {
    Meteor.call('remove.all')
  }
});
