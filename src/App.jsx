import { useState, useRef, useEffect, useCallback } from "react";

const R = "#C8102E", DR = "#8B0000", NV = "#0D2B6B";
const TRUCKS = Array.from({ length: 10 }, (_, i) => `Truck #${i + 1}`);
const EQUIP_TYPES = ["Dump","Semi","Tandem","End Dump","Side Dump","Belly Dump"];
const INIT_DRIVER_NAMES = ["Steve","Jared","Josh","Brit","Mike","Dave","Tim","Zane","Bob","Glen"];

const MATERIAL_TREE = {
  "Rock / Aggregate": ["AG-STONE","COML SCREENINGS","ENVIRONMENTAL LIMESTONE","COML 1\" MINUS STONE","COML 2\" MINUS STONE","COML 4\" MINUS STONE","COML 1\" CLEAN STONE","COML 1½\" CLEAN STONE","COML 2\" CLEAN STONE","IDOT CA01 (2-2/12 CLEAN)","IDOT CA02 (2\"x0\")","IDOT CA03 (2\"x1\")","IDOT CA05 (1½\"x1\")","IDOT CA06 (1\"x0\")","IDOT CA06 PUGMILL","IDOT CA07 (1¼\")","IDOT CM11/CA11 (¾\")","IDOT CM11/CA11 (¾\") SS","IDOT CM14 CONC ST (½\")","IDOT CM16/CA16 (⅜\")","IDOT CM16/01SS","IDOT FM20 (MFG SAND)","IDOT RR1 (2\")","IDOT RR2 (4\")","IDOT RR3 (50#)","IDOT RR4 (140#)","IDOT RR5 (400#)","IDOT RR6 (600#)","IDOT RR7 (1000#)","MoDOT GRADE D CONC STONE","MoDOT GRADE E CONC STONE","MINE RUN","Other Rock"],
  "Sand": ["IDOT FA06 SAND","IDOT FA01 SAND","Fill Sand","Mason Sand","Other Sand"],
  "Dirt": ["Topsoil","Fill Dirt","Clay","Other Dirt"],
  "Asphalt": ["Hot Mix Asphalt","Recycled Asphalt","Cold Patch","Other Asphalt"],
  "Gravel": ["Pea Gravel","Base Gravel","Crushed Gravel","Other Gravel"],
  "Building Materials": ["Concrete","Block","Lumber","Other Building Materials"],
  "Structural Demo": ["Concrete Debris","Steel","Mixed Demo","Other Demo"],
};
const TOP_MATERIALS = Object.keys(MATERIAL_TREE);
const QUARRY_MATERIALS_MAP = ["Rock / Aggregate","Sand","Gravel","Asphalt"];

const QUARRY_DB = {
  "New Frontier Materials – Bluff City": {
    address:"4007 College Ave, Alton, IL 62002", phone:"(866) 739-8855",
    email:"RIC@newfrontiermaterials.com", note:"2025 Gate Rate. Per ton + applicable taxes.",
    materials:[
      {name:"AG-STONE",code:"763",price:10.50},{name:"COML SCREENINGS",code:"764",price:10.50},
      {name:"ENVIRONMENTAL LIMESTONE",code:"765",price:10.50},{name:"COML 1\" MINUS STONE",code:"742",price:10.50},
      {name:"COML 2\" MINUS STONE",code:"737",price:10.50},{name:"COML 4\" MINUS STONE",code:"772",price:10.50},
      {name:"COML 1\" CLEAN STONE",code:"773",price:19.00},{name:"COML 1½\" CLEAN STONE",code:"746",price:19.00},
      {name:"COML 2\" CLEAN STONE",code:"738",price:19.00},{name:"IDOT CA01 (2-2/12 CLEAN)",code:"750",price:24.00},
      {name:"IDOT CA02 (2\"x0\")",code:"770",price:10.50},{name:"IDOT CA03 (2\"x1\")",code:"735",price:19.00},
      {name:"IDOT CA05 (1½\"x1\")",code:"739",price:19.00},{name:"IDOT CA06 (1\"x0\")",code:"741",price:10.50},
      {name:"IDOT CA06 PUGMILL",code:"740",price:10.50},{name:"IDOT CA07 (1¼\")",code:"744",price:19.00},
      {name:"IDOT CM11/CA11 (¾\")",code:"747",price:22.00},{name:"IDOT CM11/CA11 (¾\") SS",code:"751",price:24.00},
      {name:"IDOT CM14 CONC ST (½\")",code:"775",price:24.00},{name:"IDOT CM16/CA16 (⅜\")",code:"755",price:19.00},
      {name:"IDOT CM16/01SS",code:"752",price:21.00},{name:"IDOT FM20 (MFG SAND)",code:"767",price:21.00},
      {name:"IDOT RR1 (2\")",code:"736",price:14.50},{name:"IDOT RR2 (4\")",code:"748",price:19.00},
      {name:"IDOT RR3 (50#)",code:"757",price:19.00},{name:"IDOT RR4 (140#)",code:"756",price:24.00},
      {name:"IDOT RR5 (400#)",code:"758",price:24.00},{name:"IDOT RR6 (600#)",code:"766",price:24.00},
      {name:"IDOT RR7 (1000#)",code:"780",price:24.00},{name:"MoDOT GRADE D CONC STONE",code:"134",price:24.00},
      {name:"MoDOT GRADE E CONC STONE",code:"126",price:24.00},{name:"MINE RUN",code:"760",price:10.50},
      {name:"IDOT FA06 SAND",code:"325",price:21.00},{name:"IDOT FA01 SAND",code:"321",price:21.00},
      {name:"SMALL LOAD",code:"768",price:50.00},{name:"WEIGH IN FEE",code:"631",price:10.00},
    ]
  }
};

const mkContact    = () => ({ name:"", phone:"", email:"", text:"" });
const mkContactA   = () => ({ name:"", address:"", phone:"", email:"", text:"" });
const mkDriver     = () => ({ name:"", address:"", phone:"", email:"", text:"", license:"", emergency:mkContact(), notes:"" });
const mkCompany    = () => ({ name:"", address:"", phone:"", email:"", text:"", contact:mkContact(), billing:mkContactA(), notes:"" });
const mkQuarry     = () => ({ name:"", address:"", phone:"", email:"", text:"", ap:mkContactA(), dispatch:mkContact(), notes:"" });

const normDriver  = d => typeof d==="string" ? {...mkDriver(),name:d} : {...mkDriver(),...d, emergency:{...mkContact(),...(d.emergency||{})} };
const normCompany = c => { const b=typeof c==="string"?{name:c}:c; return {...mkCompany(),...b, contact:{...mkContact(),...(b.contact||{})}, billing:{...mkContactA(),...(b.billing||{})}}; };
const normQuarry  = q => {
  const b=typeof q==="string"?{name:q}:(q?.name?q:{name:String(q)});
  const db=QUARRY_DB[b.name];
  return {...mkQuarry(), address:db?.address||"", phone:db?.phone||"", email:db?.email||"", notes:db?.note||"", ...b, ap:{...mkContactA(),...(b.ap||{})}, dispatch:{...mkContact(),...(b.dispatch||{})} };
};

const INIT_DRIVERS   = INIT_DRIVER_NAMES.map(name=>({...mkDriver(),name}));
const INIT_COMPANIES = [{...mkCompany(),name:"RCS"},{...mkCompany(),name:"Stutz"}];
const INIT_QUARRIES  = [normQuarry("New Frontier Materials – Bluff City")];

const getName = x => typeof x==="string" ? x : (x?.name||"");

const SAMPLE_WORK_ORDERS = (() => {
  const QM=QUARRY_DB["New Frontier Materials – Bluff City"].materials;
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  const agg=[QM.find(m=>m.name.includes("CA06 (1\"x0\")",)),QM.find(m=>m.name.includes("CA06 PUGMILL")),QM.find(m=>m.name.includes("RR4")),QM.find(m=>m.name.includes("RR1")),QM.find(m=>m.name.includes("CA03")),QM.find(m=>m.name.includes("CM11/CA11 (¾\")",)),QM.find(m=>m.name.includes("MINE RUN")),QM.find(m=>m.name.includes("COML 2\" MINUS")),QM.find(m=>m.name.includes("CA01")),QM.find(m=>m.name.includes("FA06 SAND"))].filter(Boolean);
  const drivers=INIT_DRIVER_NAMES, hourly=["Steve","Jared","Josh","Brit","Mike"];
  const dates=["2026-03-02","2026-03-03","2026-03-04","2026-03-05","2026-03-06","2026-03-07"];
  const companies=["RCS","Stutz","IDOT District 8","Pike County","Alton Contractors"];
  const froms=["New Frontier – Bluff City","Quarry Gate","Bluff City Pit","Staging Yard"];
  const tos=["US-67 & Airport Rd","Pike Co. Rd 12","Alton Levee Project","RCS Yard","Stutz Job Site","I-270 Mainline"];
  const arrives=["06:00","06:30","07:00","07:15","07:30"];
  const releases=["14:30","15:00","15:30","16:00","16:30","17:00"];
  const orders=[]; let woSeq=4151;
  drivers.forEach((driver,dIdx)=>{[0,1].forEach(k=>{
    const mat=pick(agg),date=dates[(dIdx+k)%dates.length],arr=pick(arrives),rel=pick(releases);
    const [ah,am]=arr.split(":").map(Number),[rh,rm]=rel.split(":").map(Number);
    const st=((rh*60+rm)-(ah*60+am))/60;
    orders.push({workOrderNumber:"WO-"+(woSeq++),date,driver,equipmentType:"Dump",truckNumber:TRUCKS[dIdx],jobName:"Sample Job",jobNumber:"SMP-"+woSeq,topMaterial:"Rock / Aggregate",materialHauled:mat.name,quarryKnown:true,quarry:"New Frontier Materials – Bluff City",quarryMaterialName:mat.name,quarryMaterialCode:mat.code,quarryMaterialPrice:mat.price,arrivedTime:arr,releasedTime:rel,lunchWorked:k%2===0,overtimeEnabled:false,straightTime:st.toFixed(2),overtime:"",fromLocation:pick(froms),toLocation:pick(tos),companyWorkedFor:companies[(dIdx+k)%companies.length],companyAddress:"Alton, IL 62002",companyPhone:"(618) 555-0"+(100+dIdx+k),companyContactName:"",companyBillingName:"",companyBillingPhone:"",ratePerHour:hourly.includes(driver)?"150":"",ratePerLoad:hourly.includes(driver)?"":"225",gallons:String(55+(dIdx*7+k*13)%60),remarks:"SAMPLE DATA — delete via Admin > Reports",driverSig:null,foremanSig:null,status:"complete",isSampleData:true,submittedAt:new Date(date+"T10:00:00").getTime()+k*3600000});
  });});
  return orders;
})();

function fmt(d){if(!d)return"";return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"});}
function nowDate(){return new Date().toISOString().split("T")[0];}
let _lastWoNum=4151;
function initWoNum(wos){const nums=wos.map(w=>parseInt((w.workOrderNumber||"").replace("WO-",""))).filter(n=>!isNaN(n));if(nums.length>0)_lastWoNum=Math.max(...nums);}
function nextWoNum(){_lastWoNum+=1;return"WO-"+_lastWoNum;}
function calcStraight(arr,rel,lunchWorked){if(!arr||!rel)return"";const[ah,am]=arr.split(":").map(Number),[rh,rm]=rel.split(":").map(Number);let mins=(rh*60+rm)-(ah*60+am);if(lunchWorked===false)mins-=30;return mins<=0?"0.00":(mins/60).toFixed(2);}

async function exportFile(content,filename,mimeType,onMsg){
  try{const blob=new Blob([content],{type:mimeType}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();setTimeout(()=>{try{document.body.removeChild(a);URL.revokeObjectURL(url);}catch(e){}},1500);onMsg&&onMsg("✅ Download started — check your Downloads folder.");return;}catch(_){}
  try{const uri="data:"+mimeType+";charset=utf-8,"+encodeURIComponent(content),a=document.createElement("a");a.href=uri;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();setTimeout(()=>{try{document.body.removeChild(a);}catch(e){}},1000);onMsg&&onMsg("✅ Download started — check your Downloads folder.");return;}catch(_){}
  try{await navigator.clipboard.writeText(content);onMsg&&onMsg("📋 Copied to clipboard! Paste into Excel / Notes / email.");}catch(_){onMsg&&onMsg("⚠️ Could not download. Try Share / Text instead.");}
}

const S={
  lbl:{display:"block",fontSize:13,fontWeight:800,color:"#1a1a1a",marginBottom:6,letterSpacing:0.3},
  inp:{width:"100%",padding:"12px 14px",border:"2px solid #aaa",borderRadius:8,fontSize:16,outline:"none",boxSizing:"border-box",background:"#fff",color:"#111",fontWeight:500},
  sel:{width:"100%",padding:"12px 14px",border:"2px solid #aaa",borderRadius:8,fontSize:16,outline:"none",boxSizing:"border-box",background:"#fff",appearance:"none",cursor:"pointer",color:"#111",fontWeight:500},
  btn:{padding:"13px 20px",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"},
};

function Toast({msg}){if(!msg)return null;const ok=msg.startsWith("✅")||msg.startsWith("📋");return <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:ok?"#166534":"#92400E",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:600,zIndex:2000,maxWidth:320,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{msg}</div>;}

function Field({label,err,children}){return <div style={{marginBottom:16}}><label style={S.lbl}>{label}{err&&<span style={{color:R,marginLeft:6,fontSize:11}}>{err}</span>}</label>{children}</div>;}

function Section({title,icon,children}){return <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #f0f0f0"}}><span>{icon}</span><span style={{fontWeight:800,fontSize:12,color:"#333",letterSpacing:1}}>{title}</span></div>{children}</div>;}

function Header({title,sub,onBack,rightSlot}){return <div style={{background:`linear-gradient(135deg,${DR},${R})`,padding:"16px 20px",color:"#fff",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:50}}>{onBack&&<button onClick={onBack} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:20,lineHeight:1,flexShrink:0}}>‹</button>}<div style={{flex:1}}><div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:18}}>{title}</div>{sub&&<div style={{fontSize:11,opacity:0.8}}>{sub}</div>}</div>{rightSlot}</div>;}

function Modal({title,children,onClose}){return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#fff",borderRadius:14,padding:24,width:"100%",maxWidth:420,maxHeight:"85vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,color:DR,fontFamily:"Georgia,serif"}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"#999"}}>×</button></div>{children}</div></div>;}

function ContactFields({ value={}, onChange, showName=false, nameLabel="Contact Name", showAddress=true }) {
  const ch = (k,v) => onChange({...value,[k]:v});
  return (
    <div>
      {showName && <Field label={nameLabel}><input value={value.name||""} onChange={e=>ch("name",e.target.value)} style={S.inp} placeholder={nameLabel} /></Field>}
      {showAddress && <Field label="Address"><input value={value.address||""} onChange={e=>ch("address",e.target.value)} style={S.inp} placeholder="Street, City, State ZIP" /></Field>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Field label="Phone"><input type="tel" value={value.phone||""} onChange={e=>ch("phone",e.target.value)} style={S.inp} placeholder="(000) 000-0000" /></Field>
        <Field label="Text / SMS"><input type="tel" value={value.text||""} onChange={e=>ch("text",e.target.value)} style={S.inp} placeholder="(000) 000-0000" /></Field>
      </div>
      <Field label="Email"><input type="email" value={value.email||""} onChange={e=>ch("email",e.target.value)} style={S.inp} placeholder="email@example.com" /></Field>
    </div>
  );
}

function ContactListCard({icon,name,info=[],badges=[],onEdit}){
  return (
    <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span>{icon}</span><span style={{fontWeight:800,fontSize:15}}>{name||"—"}</span></div>
          {info.filter(Boolean).map((line,i)=><div key={i} style={{fontSize:13,color:"#333",marginBottom:2,wordBreak:"break-all"}}>{line}</div>)}
          {badges.length>0&&<div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>{badges.map((b,i)=><span key={i} style={{background:b.bg||"#f0f0f0",color:b.color||"#555",fontSize:11,padding:"2px 8px",borderRadius:12,fontWeight:600}}>{b.label}</span>)}</div>}
        </div>
        <button onClick={onEdit} style={{...S.btn,background:"#f0f0f0",color:"#333",padding:"8px 14px",fontSize:13,marginLeft:12,flexShrink:0}}>Edit</button>
      </div>
    </div>
  );
}

function ContactEditModal({type,data,onSave,onDelete,onClose}){
  const [local,setLocal]=useState(()=>{
    if(type==="driver") return normDriver(data||{});
    if(type==="company") return normCompany(data||{});
    return normQuarry(data||{});
  });
  const upd=(k,v)=>setLocal(p=>({...p,[k]:v}));
  const updTop=partial=>setLocal(p=>({...p,...partial}));
  const isNew=!data?.name;
  const labels={company:"Company",driver:"Driver",quarry:"Quarry"};
  const subSectionStyle={display:"flex",alignItems:"center",gap:8,margin:"4px 0 12px",paddingBottom:8,borderBottom:`2px solid ${R}22`};
  const SubHead=({icon,title})=><div style={subSectionStyle}><span style={{fontSize:16}}>{icon}</span><span style={{fontWeight:800,fontSize:11,color:"#333",letterSpacing:1,textTransform:"uppercase"}}>{title}</span></div>;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:800,display:"flex",flexDirection:"column"}}>
      <div style={{background:`linear-gradient(135deg,${DR},${R})`,padding:"14px 16px",color:"#fff",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:18,lineHeight:1}}>‹</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:17}}>{isNew?`Add New ${labels[type]}`:`Edit: ${local.name||"—"}`}</div>
          <div style={{fontSize:11,opacity:0.75}}>{{company:"Company + billing/AP contacts",driver:"Driver info + emergency contact",quarry:"Quarry + AP + dispatch"}[type]}</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,background:"#f4f4f4"}}>
        {type==="driver"&&<>
          <Section title="DRIVER INFORMATION" icon="👷">
            <Field label="Full Name *"><input value={local.name||""} onChange={e=>upd("name",e.target.value)} style={S.inp} placeholder="Driver full name" /></Field>
            <Field label="CDL / License #"><input value={local.license||""} onChange={e=>upd("license",e.target.value)} style={S.inp} placeholder="License number" /></Field>
          </Section>
          <Section title="CONTACT DETAILS" icon="📞">
            <SubHead icon="📍" title="Address & Contact" />
            <ContactFields value={{address:local.address,phone:local.phone,email:local.email,text:local.text}} onChange={updTop} showAddress={true} />
          </Section>
          <Section title="EMERGENCY CONTACT" icon="🚨">
            <SubHead icon="👤" title="Emergency Person" />
            <ContactFields value={local.emergency} onChange={v=>upd("emergency",v)} showName={true} nameLabel="Emergency Contact Name" showAddress={false} />
          </Section>
          <Section title="NOTES" icon="📝">
            <Field label="Notes / Comments"><textarea value={local.notes||""} onChange={e=>upd("notes",e.target.value)} style={{...S.inp,height:80,resize:"vertical"}} placeholder="CDL class, restrictions, any other notes..." /></Field>
          </Section>
        </>}
        {type==="company"&&<>
          <Section title="COMPANY" icon="🏢">
            <Field label="Company Name *"><input value={local.name||""} onChange={e=>upd("name",e.target.value)} style={S.inp} placeholder="Company name" /></Field>
          </Section>
          <Section title="MAIN OFFICE" icon="📍">
            <SubHead icon="🏢" title="Main Office / Headquarters" />
            <ContactFields value={{address:local.address,phone:local.phone,email:local.email,text:local.text}} onChange={updTop} showAddress={true} />
          </Section>
          <Section title="PRIMARY CONTACT" icon="👤">
            <SubHead icon="👤" title="Primary Contact Person" />
            <ContactFields value={local.contact} onChange={v=>upd("contact",v)} showName={true} nameLabel="Contact Person Name" showAddress={false} />
          </Section>
          <Section title="BILLING / ACCOUNTS PAYABLE" icon="💳">
            <SubHead icon="💳" title="Billing Office / AP Department" />
            <ContactFields value={local.billing} onChange={v=>upd("billing",v)} showName={true} nameLabel="Billing Contact Name" showAddress={true} />
          </Section>
          <Section title="NOTES" icon="📝">
            <Field label="Notes"><textarea value={local.notes||""} onChange={e=>upd("notes",e.target.value)} style={{...S.inp,height:80,resize:"vertical"}} placeholder="Account notes, payment terms, etc." /></Field>
          </Section>
        </>}
        {type==="quarry"&&<>
          <Section title="QUARRY" icon="🪨">
            <Field label="Quarry Name *"><input value={local.name||""} onChange={e=>upd("name",e.target.value)} style={S.inp} placeholder="Quarry / pit name" /></Field>
          </Section>
          <Section title="MAIN OFFICE" icon="📍">
            <SubHead icon="🏭" title="Main Office / Gate" />
            <ContactFields value={{address:local.address,phone:local.phone,email:local.email,text:local.text}} onChange={updTop} showAddress={true} />
          </Section>
          <Section title="ACCOUNTS PAYABLE" icon="💳">
            <SubHead icon="💳" title="AP / Billing Department" />
            <ContactFields value={local.ap} onChange={v=>upd("ap",v)} showName={true} nameLabel="AP Contact Name" showAddress={true} />
          </Section>
          <Section title="SCALE / DISPATCH" icon="⚖️">
            <SubHead icon="⚖️" title="Scale House / Dispatch" />
            <ContactFields value={local.dispatch} onChange={v=>upd("dispatch",v)} showName={true} nameLabel="Dispatch Contact Name" showAddress={false} />
          </Section>
          <Section title="NOTES" icon="📝">
            <Field label="Notes / Gate info"><textarea value={local.notes||""} onChange={e=>upd("notes",e.target.value)} style={{...S.inp,height:80,resize:"vertical"}} placeholder="Hours, gate code, pricing notes..." /></Field>
          </Section>
        </>}
      </div>
      <div style={{background:"#fff",padding:"14px 16px",display:"flex",gap:10,boxShadow:"0 -4px 16px rgba(0,0,0,0.12)",flexShrink:0}}>
        {onDelete&&<button onClick={()=>{if(window.confirm(`Delete "${local.name}"? This cannot be undone.`))onDelete();}} style={{...S.btn,background:"#FEF2F2",color:"#991b1b",border:"1.5px solid #fecaca",padding:"12px 14px",fontSize:13}}>🗑 Delete</button>}
        <button onClick={onClose} style={{...S.btn,background:"#f0f0f0",color:"#333",padding:"12px 16px"}}>Cancel</button>
        <button onClick={()=>{if(!local.name?.trim()){alert("Name is required");return;}onSave(local);}} style={{...S.btn,background:R,color:"#fff",flex:1,fontSize:15}}>✓ Save {labels[type]}</button>
      </div>
    </div>
  );
}

function LocationInput({value,onChange,placeholder,savedLocations}){
  const [open,setOpen]=useState(false);
  const matches=savedLocations.filter(l=>l.toLowerCase().includes(value.toLowerCase())&&l.toLowerCase()!==value.toLowerCase());
  return <div style={{position:"relative"}}><input value={value} onChange={e=>{onChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),180)} style={S.inp} placeholder={placeholder} autoComplete="off" />{open&&matches.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"2px solid #aaa",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:200,maxHeight:160,overflowY:"auto"}}>{matches.slice(0,6).map(m=><div key={m} onMouseDown={()=>{onChange(m);setOpen(false);}} style={{padding:"10px 14px",fontSize:14,fontWeight:500,color:"#111",cursor:"pointer",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.target.style.background="#f5f5f5"} onMouseLeave={e=>e.target.style.background="#fff"}>📍 {m}</div>)}</div>}</div>;
}

function SigCanvas({onSave,onCancel,label}){
  const canvasRef=useRef(null),drawing=useRef(false),lastPos=useRef(null);
  const getPos=(e,canvas)=>{
    const r=canvas.getBoundingClientRect(),scaleX=canvas.width/r.width,scaleY=canvas.height/r.height,src=e.touches?e.touches[0]:e;
    return{x:(src.clientX-r.left)*scaleX,y:(src.clientY-r.top)*scaleY};
  };
  const start=e=>{e.preventDefault();drawing.current=true;const pos=getPos(e,canvasRef.current);lastPos.current=pos;const ctx=canvasRef.current.getContext("2d");ctx.beginPath();ctx.arc(pos.x,pos.y,1.5,0,Math.PI*2);ctx.fillStyle="#000";ctx.fill();};
  const move=e=>{e.preventDefault();if(!drawing.current)return;const canvas=canvasRef.current,ctx=canvas.getContext("2d"),pos=getPos(e,canvas);ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle="#000";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.stroke();lastPos.current=pos;};
  const end=()=>{drawing.current=false;};
  const drawGuide=useCallback(()=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle="#ddd";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,160);ctx.lineTo(canvas.width-20,160);ctx.stroke();ctx.fillStyle="#ccc";ctx.font="13px serif";ctx.fillText("✕",22,158);},[]);
  useEffect(()=>{drawGuide();},[drawGuide]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:"100%",maxWidth:480}}>
        <p style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:DR,marginBottom:8}}>{label}</p>
        <p style={{fontSize:13,color:"#333",marginBottom:12}}>Sign with finger or stylus — draw directly on the pad below</p>
        <canvas ref={canvasRef} width={880} height={300} style={{border:`2px solid ${R}`,borderRadius:8,width:"100%",touchAction:"none",display:"block",cursor:"crosshair"}} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button onClick={drawGuide} style={{flex:1,padding:12,background:"#eee",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>Clear</button>
          <button onClick={onCancel} style={{flex:1,padding:12,background:"#eee",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onSave(canvasRef.current.toDataURL())} style={{flex:2,padding:12,background:R,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer"}}>✓ Accept Signature</button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({drivers,onLogin,onAdmin}){
  const [selected,setSelected]=useState(""),[ err,setErr]=useState("");
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${DR} 0%,${R} 50%,#1a1a1a 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{display:"inline-block",background:"#fff",borderRadius:16,padding:"18px 32px",marginBottom:12}}>
          <div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:38,color:R,lineHeight:1}}>RJS</div>
          <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:18,color:"#222",letterSpacing:4}}>HAULING</div>
        </div>
        <p style={{color:"rgba(255,255,255,0.65)",fontSize:12,margin:0,letterSpacing:2}}>FIELD OPERATIONS • DOW, IL</p>
      </div>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
        <h2 style={{fontFamily:"Georgia,serif",color:"#1a1a1a",margin:"0 0 6px"}}>Driver Sign In</h2>
        <p style={{color:"#444",fontSize:14,margin:"0 0 20px"}}>Select your name to begin</p>
        <label style={S.lbl}>Your Name</label>
        <select value={selected} onChange={e=>{setSelected(e.target.value);setErr("");}} style={S.sel}>
          <option value="">-- Select Driver --</option>
          {drivers.map(d=>{const n=getName(d);return <option key={n} value={n}>{n}</option>;})}
        </select>
        {err&&<p style={{color:R,fontSize:12,margin:"6px 0 0"}}>{err}</p>}
        <button onClick={()=>{if(!selected){setErr("Please select your name");return;}onLogin(selected);}} style={{...S.btn,background:R,color:"#fff",marginTop:20,width:"100%",fontSize:17}}>Clock In &amp; Start</button>
        <button onClick={onAdmin} style={{marginTop:10,width:"100%",background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",padding:8}}>Admin / Settings ›</button>
      </div>
      <p style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginTop:24}}>Bob Sanders 618-818-8225 • Glenn Sanders 618-779-6576</p>
    </div>
  );
}

function Dashboard({driver,onNewWO,onQueue,onReports,onLogout,onAdmin,onEndOfDay,workOrders}){
  const today=nowDate();
  const todayWOs=workOrders.filter(w=>w.date===today);
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
  const weekWOs=workOrders.filter(w=>new Date(w.date+"T00:00:00")>=weekStart);
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <div style={{background:`linear-gradient(135deg,${DR},${R})`,padding:"20px 20px 30px",color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:26}}>RJS HAULING</div><div style={{fontSize:12,opacity:0.8}}>Welcome, {driver.split(" ")[0]}</div></div>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>Sign Out</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          {[{label:"Today",val:todayWOs.length},{label:"This Week",val:weekWOs.length},{label:"All Time",val:workOrders.length}].map(s=><div key={s.label} style={{flex:1,background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:26,fontWeight:900}}>{s.val}</div><div style={{fontSize:10,opacity:0.85,marginTop:2}}>{s.label}</div></div>)}
        </div>
      </div>
      <div style={{padding:20,marginTop:-10}}>
        <button onClick={onNewWO} style={{width:"100%",background:R,color:"#fff",border:"none",borderRadius:16,padding:20,fontSize:18,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 24px rgba(200,16,46,0.4)",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{fontSize:24}}>＋</span> New Work Order</button>
        <button onClick={onEndOfDay} style={{width:"100%",background:NV,color:"#fff",border:"none",borderRadius:14,padding:"16px 20px",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 16px rgba(13,43,107,0.35)"}}><span style={{fontSize:22}}>⛽</span> End of Day — Log Fuel &amp; Hours</button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[{icon:"📋",label:"Queue",sub:`${workOrders.length}`,action:onQueue},{icon:"📊",label:"Reports",sub:"Daily/Wkly",action:onReports},{icon:"⚙️",label:"Admin",sub:"Contacts",action:onAdmin}].map(a=><button key={a.label} onClick={a.action} style={{background:"#fff",border:"none",borderRadius:14,padding:"16px 10px",cursor:"pointer",textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}><div style={{fontSize:24,marginBottom:4}}>{a.icon}</div><div style={{fontWeight:700,color:"#1a1a1a",fontSize:13}}>{a.label}</div><div style={{color:"#444",fontSize:12,fontWeight:600,marginTop:2}}>{a.sub}</div></button>)}
        </div>
        {todayWOs.length>0&&<div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}><h3 style={{margin:"0 0 12px",fontSize:13,color:"#333",fontWeight:800,letterSpacing:1}}>TODAY'S TICKETS</h3>{todayWOs.slice(-5).reverse().map((wo,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<Math.min(todayWOs.length,5)-1?"1px solid #f0f0f0":"none"}}><div><div style={{fontWeight:700,fontSize:14}}>{wo.workOrderNumber}</div><div style={{color:"#444",fontSize:13,fontWeight:500}}>{wo.companyWorkedFor||"—"} • {wo.topMaterial}</div></div><span style={{background:wo.status==="complete"?"#dcfce7":"#fef9c3",color:wo