const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

let credits = {}; // stores all paid numbers automatically

// HOME PAGE - YOUR BOT WEBSITE
app.get('/', (req,res)=>{
 res.send(`
 <h2>Ask A Town Planner - Lagos</h2>
 <p>Pay N2000 to ask any town planning question</p>
 <input id="phone" placeholder="080... phone used for payment" style="width:300px;padding:10px"><br><br>
 <textarea id="q" placeholder="Your question..." style="width:300px;height:100px"></textarea><br><br>
 <button onclick="ask()" style="padding:10px 20px;background:green;color:white">ASK EXPERT</button>
 <p id="ans"></p>
 <script>
 async function ask(){
   let phone=document.getElementById('phone').value;
   let question=document.getElementById('q').value;
   let r=await fetch('/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,question})});
   let d=await r.json();
   document.getElementById('ans').innerText=d.answer||d.error;
 }
 </script>
 `)
});

// ASK EXPERT
app.post('/ask', async (req,res)=>{
 let {phone, question}=req.body;
 phone=phone.replace(/\D/g,'').slice(-11);
 if(!credits[phone] || credits[phone]<=0) return res.json({error:"No credit. Please pay first on Paystack. Use same phone number."});

 // CALL AI (Groq)
 try{
   let aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions',{
     method:'POST',
     headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.GROQ_KEY},
     body: JSON.stringify({
       model:'llama-3.1-8b-instant',
       messages:[
         {role:'system',content:'You are a Registered Town Planner in Lagos, Nigeria. Expert in LASPPPA, LASBCA, setbacks, building approval, C of O. Answer professionally.'},
         {role:'user',content:question}
       ]
     })
   });
   let data=await aiRes.json();
   let answer=data.choices[0].message.content;
   credits[phone]--;
   res.json({answer});
 }catch(e){res.json({error:"AI error, try again"})}
});

// PAYSTACK WEBHOOK - AUTOMATIC CREDIT
app.post('/paystack-webhook', (req,res)=>{
 let event=req.body;
 if(event.event==='charge.success'){
   let phone = (event.data.metadata?.phone || event.data.customer?.phone || '').replace(/\D/g,'').slice(-11);
   if(phone){
     credits[phone]=(credits[phone]||0)+1;
     console.log('CREDIT ADDED FOR:',phone);
   }
 }
 res.sendStatus(200);
});
app.get('/give-credit', (req,res)=>{
  let phone=(req.query.phone||'').replace(/\D/g,'').slice(-11);
  credits[phone]=(credits[phone]||0)+5;
  res.send('Credit added for '+phone);
});
app.listen(10000, ()=>console.log('LIVE'));
