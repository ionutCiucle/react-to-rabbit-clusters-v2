'use strict';
const amqp = require('amqplib/callback_api');

class Consumer {
  constructor(queueName) {
    this.queue = queueName || 'default';
  } 

  dequeue(amount, callback){
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
          if (ok) {
            for(let i=0; i < amount; i++) {
              ch.get(this.queue, { noAck: false }, (err, msg) => {
                if (err) {
                  throw err;
                }
                if (msg) {
                  callback().then(
                    () => {
                      console.log(`Got desired response, acknowledged message | Remaining: ${msg.fields.messageCount}`);
                      ch.ack(msg);
                    }, 
                    () => {
                      // Requeue message
                      // Leaving it in the queue would make it get forgotten acknowledgement 
                      // AKA: it's still in the queue, but channel.assertQueue won't detect it,
                      // not even when reintantiating the QueueStakeholder who was peeking

                      console.log(`Didn\'t get desired response, ack and try again | Remaining: ${msg.fields.messageCount}`);  
                      
                      const rejectedMessage = msg.content;
                      
                      ch.ack(msg);
                      ch.sendToQueue(this.queue, rejectedMessage);
                    }
                  );
                }
              });
            }
          }
        }); 
      });
    });      
  }
}

module.exports = Consumer;