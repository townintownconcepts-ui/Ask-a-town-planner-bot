const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

const PAYSTACK_LINK = "https://paystack.shop/pay/r3idx7vvad";

let credits = {"08025933210":1};
app.use(express.json());

function normalizePhone(p){
  if(!p) return null;
  p = p.toString().replace(/\s+/g,'');
  if(p.startsWith('+234')) return '0'+p.slice(4);
  if(p.startsWith('234')) return '0'+p.slice(3);
  return p;
}

app.post('/paystack-webhook', (req,res)=>{
  try{
    const event = req.body;
    if(event.event === 'charge.success'){
      const phone = normalizePhone(event.data.customer?.phone || event.data.metadata?.phone);
      if(phone){
        credits[phone] = (credits[phone]||0) + 1;
        console.log(`CREDIT: ${phone} = ${credits[phone]}`);
      }
    }
  }catch(e){}
  res.sendStatus(200);
});

app.post('/ask', (req,res)=>{
  const phone = normalizePhone(req.body.phone);
  const q = req.body.question;
  if(!phone ||!q) return res.json({reply:"Enter phone + question"});

  if((credits[phone]||0) <= 0){
    return res.json({reply:`No credit. Pay ₦2000 here: ${PAYSTACK_LINK} then use phone ${phone}`, needPay:true, payLink: PAYSTACK_LINK});
  }
  credits[phone]--;
  const reply = `🏛️ LAGOS TOWN PLANNING:\n\nQuery: "${q}"\n\n1. Setback: 3m front, 1.5m side (LASPPPA)\n2. Verify C of O at Lands Bureau\n3. Submit via e-planning with drawings\n\nRemaining credits: ${credits[phone]}\n\n- Town In Town Concepts`;
  res.json({reply, credits: credits[phone]});
});

app.get('/', (req,res)=>{
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ask Town Planner</title>
<style>body{font-family:sans-serif;max-width:500px;margin:auto;padding:20px;background:#f5f7fb}.card{background:white;padding:20px;border-radius:12px}input,textarea{width:100%;padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:8px}button{background:#1e40af;color:white;padding:14px;border:none;border-radius:8px;width:100%;font-weight:bold}.pay{display:block;background:#fbbf24;color:black;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;margin:12px 0}#ans{white-space:pre-wrap;background:#eef2ff;padding:12px;border-radius:8px;margin-top:12px}</style></head><body>
<div class="card"><h2>🏛️ Ask A Town Planner - Lagos</h2><p>Pay ₦2,000 per question</p><a class="pay" href="${PAYSTACK_LINK}" target="_blank">💳 PAY ₦2,000 NOW</a>
<input id="phone" placeholder="080... phone used for payment"/><textarea id="q" rows="4" placeholder="Your question..."></textarea><button onclick="ask()">ASK EXPERT</button><div id="ans">Test card: 4084 0840 8408 4081, 12/30, CVV 408, PIN 0000</div></div>
<script>async function ask(){const phone=document.getElementById('phone').value;const question=document.getElementById('q').value;document.getElementById('ans').innerText='Thinking...';const r=await fetch('/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,question})});const j=await r.json();document.getElementById('ans').innerText=j.reply;if(j.payLink){document.getElementById('ans').innerHTML=j.reply+'<br><br><a href=\\''+j.payLink+'\\' target=\\'_blank\\' style=\\'background:#fbbf24;padding:10px;display:block;text-align:center;border-radius:8px;text-decoration:none\\'>PAY NOW</a>';}}</script></body></html>`);
});

app.listen(PORT, ()=>console.log('Running'));
