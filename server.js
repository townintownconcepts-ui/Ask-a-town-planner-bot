const express = require('express');
const { getLandrizaReport, formatForWhatsApp } = require('./landriza.js');

const app = express();
app.use(express.json());

let credits = {};

// Home
app.get('/', (req,res)=>{
  res.send('Town Planner Bot + LANDRIZA Running ✅ - Use /ask and /landriza');
});

// Your existing Town Planner
app.post('/ask', async (req,res)=>{
  let {phone, question}=req.body;
  // FREE FOR NOW - auto give credit
  phone=phone.replace(/\D/g,'').slice(-10);
  credits[phone]=(credits[phone]||0)+1;

  try{
    let aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json', 'Authorization': 'Bearer '+process.env.GROQ_KEY},
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
    res.json({answer:answer});
  }catch(e){
    res.json({error:'Error: '+e.message+' - Check GROQ_KEY'});
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
  if(!lat ||!lon) return res.status(400).json({error:"Send lat and lon"});

  let reportData = getLandrizaReport(parseFloat(lat), parseFloat(lon), plotSize||"600m²");
  let whatsappText = formatForWhatsApp(reportData);

  res.json({
    success: true,
    report: reportData,
    whatsappText: whatsappText
  });
});

// Also allow GET for easy testing
app.get('/landriza', (req,res)=>{
  let {lat, lon, plotSize} = req.query;
  if(!lat ||!lon) return res.json({message:"Use?lat=6.5244&lon=3.3792&plotSize=600m²", example:"/landriza?lat=6.4281&lon=3.4219"});
  let reportData = getLandrizaReport(parseFloat(lat), parseFloat(lon), plotSize||"600m²");
  let whatsappText = formatForWhatsApp(reportData);
  res.json({report: reportData, whatsappText: whatsappText});
});

app.listen(10000, ()=>console.log('Running on 10000 - Town Planner + LANDRIZA'));
