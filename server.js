const express = require('express');
const express = require('express');
const { getLandrizaReport, formatForWhatsApp } = require('./landriza.js');

const app = express();
app.use(express.json());

let credits = {};

// Home
app.get('/', (req,res)=>{
  res.send('Town Planner + LANDRIZA Running ✅ - Use /ask and /landriza and /webhook');
});

// /ask - Town planner
app.post('/ask', async (req,res)=>{
  let {phone, question}=req.body;
  phone=phone.replace(/\D/g,'').slice(-10);
  credits[phone]=(credits[phone]||0)+1;
  try{
    let aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.GROQ_KEY},
        body: JSON.stringify({
          model:'llama-3.1-8b-instant',
          messages:[
            {role:'system',content:'You are a helpful Nigerian Town Planner assistant.'},
            {role:'user',content:question}
          ]
        })
    });
    let aiData = await aiRes.json();
    let answer = aiData.choices?.[0]?.message?.content || "No answer";
    res.json({answer});
  }catch(e){
    res.json({error:'Error: '+e.message});
  }
});

// Give credit
app.get('/give-credit', (req,res)=>{
  let phone=(req.query.phone||'').replace(/\D/g,'').slice(-10);
  credits[phone]=(credits[phone]||0)+5;
  res.send('Credit added for '+phone);
});

// --- LANDRIZA PRODUCT 1 ---
app.post('/landriza', (req,res)=>{
  let {lat, lon, plotSize} = req.body;
  if(!lat ||!lon) return res.status(400).json({error:"Send lat, lon"});
  let reportData = getLandrizaReport(parseFloat(lat), parseFloat(lon), plotSize||"600m²");
  let whatsappText = formatForWhatsApp(reportData);
  res.json({success:true, report:reportData, whatsappText});
});

app.get('/landriza', (req,res)=>{
  let {lat, lon, plotSize} = req.query;
  if(!lat ||!lon) return res.json({message:"Use?lat=6.5244&lon=3.3792", example:"/landriza?lat=6.4281&lon=3.4219"});
  let reportData = getLandrizaReport(parseFloat(lat), parseFloat(lon), plotSize||"600m²");
  let whatsappText = formatForWhatsApp(reportData);
  res.json({report:reportData, whatsappText});
});

// --- WHATSAPP WEBHOOK FOR LOCATION PIN ---
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "town123";

app.get('/webhook', (req,res)=>{
  let mode=req.query['hub.mode'];
  let token=req.query['hub.verify_token'];
  let challenge=req.query['hub.challenge'];
  if(mode==='subscribe' && token===VERIFY_TOKEN){
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req,res)=>{
  try{
    let message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!message) return res.sendStatus(200);

    let from = message.from;
    let lat, lon;

    if(message.type==='location'){
      lat = message.location.latitude;
      lon = message.location.longitude;
    } else if(message.type==='text'){
      let m = message.text.body.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      if(m){ lat=parseFloat(m[1]); lon=parseFloat(m[2]); }
    }

    if(lat && lon){
      let report = getLandrizaReport(lat, lon, "600m²");
      let whatsappMsg = formatForWhatsApp(report);

      await fetch(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,{
        method:'POST',
        headers:{
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          messaging_product:"whatsapp",
          to: from,
          type:"text",
          text:{ body: whatsappMsg }
        })
      });
    }
    res.sendStatus(200);
  }catch(e){
    console.error(e);
    res.sendStatus(200);
  }
});

app.listen(10000, ()=>console.log('Running on 10000 - Town Planner + LANDRIZA + WEBHOOK'));
