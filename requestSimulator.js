'use strict';
const Promise = require('bluebird');

module.exports = () => {
  const i = Math.round(Math.random() * 100);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (i%2 === 0) {
        console.log('Even i!');
        resolve();
      } else {
        console.log('Odd i!');
        reject();
      }
    }, 500);
  });
};