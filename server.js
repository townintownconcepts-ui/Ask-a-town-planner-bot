const { getLandrizaReport, formatForWhatsApp } = require('./landriza.js');const express=require('express');
const app=express();
app.use(express.json());
let credits={};

app.get('/', (req,res)=>{
 res.send(`
<h2>Ask A Town Planner - Lagos</h2>
<p><b>Welcome!</b> Ask any Town Planning question - N2000 per question</p>
<p style="background:#fff3cd;padding:10px;">For now bot is FREE for testing - Just type phone and ask!</p>
<input id="phone" placeholder="Your phone e.g 8111827390" style="padding:10px;width:90%"><br><br>
<textarea id="q" placeholder="Type your town planning question here..." style="width:90%;height:100px;padding:10px"></textarea><br><br>
<button onclick="ask()" style="padding:12px;background:green;color:white;width:95%;font-size:18px;">ASK EXPERT</button>
<p id="ans" style="white-space:pre-wrap;background:#f0f0f0;padding:10px;"></p>
<script>
async function ask(){
 let phone=document.getElementById('phone').value;
 let question=document.getElementById('q').value;
 if(!phone||!question){alert('Fill phone and question');return;}
 document.getElementById('ans').innerText='Thinking... please wait';
 let r=await fetch('/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,question})});
 let d=await r.json();
 document.getElementById('ans').innerText=d.answer||d.error;
}
</script>
 `)
});

app.post('/ask', async (req,res)=>{
  let {phone, question}=req.body;
  // FREE FOR NOW - auto give credit
  phone=phone.replace(/\D/g,'').slice(-10);
  credits[phone]=(credits[phone]||0)+1;

  try{
    let aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.GROQ_KEY},
        body: JSON.stringify({
          model:'llama-3.1-8b-instant',
          messages:[
            {role:'system',content:'You are a senior Lagos Town Planning expert from LASPPPA. Answer clearly, mention setbacks, approvals, zoning, fees. Use simple English.'},
            {role:'user',content:question}
          ]
        })
    });
    let aiData = await aiRes.json();
    let answer = aiData.choices?.[0]?.message?.content || 'AI could not answer';
    res.json({answer:answer});
  }catch(e){
    res.json({error:'Error: '+e.message+' Check GROQ_KEY on Render'});
  }
});

app.get('/give-credit', (req,res)=>{
  let phone=(req.query.phone||'').replace(/\D/g,'').slice(-10);
  credits[phone]=(credits[phone]||0)+5;
  res.send('Credit added for '+phone);
});

app.listen(10000, ()=>console.log('Running'));
