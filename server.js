const express=require('express');
const app=express();
app.use(express.json());

let credits={};

app.get('/', (req,res)=>{
 res.send(`
<h2>Ask A Town Planner - Lagos</h2>
<p>Pay N2000 to ask any town planning question</p>
<p><a href="https://paystack.com/pay/ask-a-town-planner" target="_blank" style="background:green;color:white;padding:10px;text-decoration:none;">CLICK HERE TO PAY N2000</a></p>
<input id="phone" placeholder="080... phone used to pay"><br><br>
<textarea id="q" placeholder="Your question" style="width:300px;height:100px"></textarea><br><br>
<button onclick="ask()" style="padding:10px;background:green;color:white;">ASK EXPERT</button>
<p id="ans"></p>
<script>
async function ask(){
 let phone=document.getElementById('phone').value;
 let question=document.getElementById('q').value;
 document.getElementById('ans').innerText='Checking...';
 let r=await fetch('/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,question})});
 let d=await r.json();
 document.getElementById('ans').innerText=d.answer||d.error;
}
</script>
 `)
});

// PAYSTACK WEBHOOK - gives credit automatically after pay
app.post('/paystack-webhook', (req,res)=>{
  let phone=(req.body.data?.metadata?.phone||'').replace(/\D/g,'').slice(-10);
  if(phone){
    credits[phone]=(credits[phone]||0)+1;
    console.log('Credit for '+phone);
  }
  res.sendStatus(200);
});

// ASK EXPERT
app.post('/ask', async (req,res)=>{
  let {phone, question}=req.body;
  phone=phone.replace(/\D/g,'').slice(-10);
  if(!credits[phone] || credits[phone]<=0){
    return res.json({error:'No credit. Please pay first on Paystack. Use same phone number.'});
  }

  // CALL AI (Groq)
  try{
    let aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.GROQ_KEY},
        body: JSON.stringify({
          model:'llama-3.1-8b-instant',
          messages:[
            {role:'system',content:'You are a Lagos Town Planning expert. Answer simple and professional. Mention LASPPPA, setbacks, approvals.'},
            {role:'user',content:question}
          ]
        })
    });
    let aiData = await aiRes.json();
    let answer = aiData.choices[0].message.content;
    credits[phone]--;
    res.json({answer:answer+'\n\n(Credits left: '+credits[phone]+')'});
  }catch(e){
    res.json({error:'AI error: '+e.message});
  }
});

// MANUAL GIVE CREDIT (for you to test)
app.get('/give-credit', (req,res)=>{
  let phone=(req.query.phone||'').replace(/\D/g,'').slice(-10);
  credits[phone]=(credits[phone]||0)+5;
  res.send('Credit added for '+phone+' - you now have '+credits[phone]+' credits. Go back and ask!');
});

app.listen(10000, ()=>console.log('Running'));
