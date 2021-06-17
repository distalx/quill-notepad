import { Meteor } from 'meteor/meteor';

import { Users } from '/imports/api/users';
import { Ops } from '/imports/api/ops';

Meteor.startup(() => {
  // code to run on server at startup
});


Meteor.methods({
  'remove.all'(data){
    this.unblock();
    Ops.remove({});
    Users.remove({});
  }
})
