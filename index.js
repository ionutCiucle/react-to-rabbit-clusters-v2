'use strict';
const cluster = require('cluster');
const express = require('express');
const os = require('os');

const Producer = require('./queue-entities/producer');
const Consumer = require('./queue-entities/consumer');
const requestSimulator = require('./requestSimulator');

const app = new express();

if (cluster.isMaster) {
  const numCpus = os.cpus().length;
  const timeLimit = 1000;
  const msgLimit = 16;

  const p = new Producer();
  // Initial worker fork
  for(let i = 0; i < numCpus; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    const messagesPerWorker = Math.round(msgLimit / numCpus); //some rounding needed here

    worker.send({ msgLimit: messagesPerWorker });
  });

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} has finished its job. It\'s going home...`);
  });

  // Schedule workers' cycle
  setInterval(() => {
    p.getQueueLength().then(
      (queueLength) => {
        if (queueLength > 0) {
          // Set surviving workers to a new cycle 
          console.log('----------- NEW CYCLE -----------');
          Object.keys(cluster.workers).forEach((key) => {
            cluster.workers[key].send({ msgLimit: msgLimit / numCpus });
          });

          // Respawn all dead workers after survivors were set to work
          const deadWorkersCount = numCpus - Object.keys(cluster.workers).length;

          for (let i = 0; i < deadWorkersCount; i++) {
            cluster.fork();
          }

        } else {
          console.log('No messages in queue, no need for forking people!');
        }
      },
      (rejectData) => {
        throw 'Something went wrong when checking the queue for messages...';
      }
    );
  }, timeLimit);

  app.get('/', (req, res) => {
    p.enqueue(100);	
    res.send('Yeeehaaaa!');
  });
  
  app.listen(3000, () => { 
    console.log('Listening...'); 
  });
} else {
  const c = new Consumer();

  process.on('message', (msg) => {
    console.log('Got it, boss!');
    const msgLimit = msg.msgLimit;
    c.dequeue(msgLimit, requestSimulator);
  });
}
