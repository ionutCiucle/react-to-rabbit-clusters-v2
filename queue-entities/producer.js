'use strict';
const amqp = require('amqplib/callback_api');
const Promise = require('bluebird');

class Producer {
  constructor(queueName) {
    this.queue = queueName || 'default';
    console.log('created a new Producer instance');
  }

  enqueue(amount) {
    amqp.connect('amqp://localhost', (err, conn) => {
      if (err) {
        console.log('Start RabbitMQ service!');
        return;
      }  

      conn.createChannel((err, ch) => {
        if (err) {
          throw err;
        }
        ch.assertQueue(this.queue, { durable: false }, (err, ok) => { 
          for (let i = 0; i < amount; i++) {
            ch.sendToQueue(this.queue, new Buffer(`Message ${i}`));
          }
          console.log(`Added ${amount} messages to the queue | TOTAL:  ${ok.messageCount}`); 
        }); 
      });
    });
  }

  getQueueLength() {
    return new Promise((resolve, reject) => {
      amqp.connect('amqp://localhost', (err, conn) => {
        if (err) {
          console.log('Start RabbitMQ service!');
          return;
        }
        conn.createChannel((err, ch) => {
          if (err) {
            throw err;
          }
          ch.assertQueue(this.queue, { durable: false }, (err, ok) => {
            if (err) {
              // console.log(err);
              reject(err);
            }
            if (ok) {
              // console.log(ok);
              resolve(ok.messageCount);
            }
          });
        });        
      });
    });
  }
}

module.exports = Producer;