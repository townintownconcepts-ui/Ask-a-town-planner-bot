const express = require('express');
const app = express();
app.use(express.json());
app.get('/', (req,res)=>{
 res.send('Ask a Town Planner Bot LIVE - '+new Date());
});
app.post('/webhook/paystack',(req,res)=>{
 console.log(req.body.event);
 res.sendStatus(200);
});
app.post('/webhook/wati',(req,res)=>{
 console.log('WATI');
 res.sendStatus(200);
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Running '+PORT));
