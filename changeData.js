var fs = require('fs');
var data = require('./data/data.json');


var new_arr = [];

for (var obj of data) {
  if (obj["Neighborhood District"].includes("resid")) {
    new_arr.push(obj);
  }
}
//
fs.writeFile('new_data.json', JSON.stringify(new_arr));
//
// console.log(new_arr);
