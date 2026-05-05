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
  const agg=[QM.find(m=>m.name.includes("CA06 (1\"x0\")")),QM.find(m=>m.name.includes("CA06 PUGMILL")),QM.find(m=>m.name.includes("RR4")),QM.find(m=>m.name.includes("RR1")),QM.find(m=>m.name.includes("CA03")),QM.find(m=>m.name.includes("CM11/CA11 (¾\")")),QM.find(m=>m.name.includes("MINE RUN")),QM.find(m=>m.name.includes("COML 2\" MINUS")),QM.find(m=>m.name.includes("CA01")),QM.find(m=>m.name.includes("FA06 SAND"))].filter(Boolean);
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
  lbl:{display:"block",fontSize:12,fontWeight:700,color:"#555",marginBottom:5,letterSpacing:0.3},
  inp:{width:"100%",padding:"11px 12px",border:"1.5px solid #ddd",borderRadius:8,fontSize:15,outline:"none",boxSizing:"border-box",background:"#fafafa"},
  sel:{width:"100%",padding:"11px 12px",border:"1.5px solid #ddd",borderRadius:8,fontSize:15,outline:"none",boxSizing:"border-box",background:"#fafafa",appearance:"none",cursor:"pointer"},
  btn:{padding:"13px 20px",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"},
};

function Toast({msg}){if(!msg)return null;const ok=msg.startsWith("✅")||msg.startsWith("📋");return <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:ok?"#166534":"#92400E",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:600,zIndex:2000,maxWidth:320,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{msg}</div>;}
function Field({label,err,children}){return <div style={{marginBottom:16}}><label style={S.lbl}>{label}{err&&<span style={{color:R,marginLeft:6,fontSize:11}}>{err}</span>}</label>{children}</div>;}
function Section({title,icon,children}){return <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #f0f0f0"}}><span>{icon}</span><span style={{fontWeight:800,fontSize:12,color:"#888",letterSpacing:1}}>{title}</span></div>{children}</div>;}
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
          {info.filter(Boolean).map((line,i)=><div key={i} style={{fontSize:12,color:"#666",marginBottom:2,wordBreak:"break-all"}}>{line}</div>)}
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
  const SubHead=({icon,title})=><div style={subSectionStyle}><span style={{fontSize:16}}>{icon}</span><span style={{fontWeight:800,fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>{title}</span></div>;
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
            <ContactFields value={{address:local.address,phone:local.phone,email:local.email,text:local.text}} onChange={updTop} showAddress={true}/>
          </Section>
          <Section title="EMERGENCY CONTACT" icon="🚨">
            <SubHead icon="👤" title="Emergency Person" />
            <ContactFields value={local.emergency} onChange={v=>upd("emergency",v)} showName={true} nameLabel="Emergency Contact Name" showAddress={false}/>
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
            <ContactFields value={{address:local.address,phone:local.phone,email:local.email,text:local.text}} onChange={updTop} showAddress={true}/>
          </Section>
          <Section title="PRIMARY CONTACT" icon="👤">
            <SubHead icon="👤" title="Primary Contact Person" />
            <ContactFields value={local.contact} onChange={v=>upd("contact",v)} showName={true} nameLabel="Contact Person Name" showAddress={false}/>
          </Section>
          <Section title="BILLING / ACCOUNTS PAYABLE" icon="💳">
            <SubHead icon="💳" title="Billing Office / AP Department" />
            <ContactFields value={local.billing} onChange={v=>upd("billing",v)} showName={true} nameLabel="Billing Contact Name" showAddress={true}/>
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
            <ContactFields value={{address:local.address,phone:local.phone,email:local.email,text:local.text}} onChange={updTop} showAddress={true}/>
          </Section>
          <Section title="ACCOUNTS PAYABLE" icon="💳">
            <SubHead icon="💳" title="AP / Billing Department" />
            <ContactFields value={local.ap} onChange={v=>upd("ap",v)} showName={true} nameLabel="AP Contact Name" showAddress={true}/>
          </Section>
          <Section title="SCALE / DISPATCH" icon="⚖️">
            <SubHead icon="⚖️" title="Scale House / Dispatch" />
            <ContactFields value={local.dispatch} onChange={v=>upd("dispatch",v)} showName={true} nameLabel="Dispatch Contact Name" showAddress={false}/>
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
  return <div style={{position:"relative"}}><input value={value} onChange={e=>{onChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),180)} style={S.inp} placeholder={placeholder} autoComplete="off" />{open&&matches.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1.5px solid #ddd",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:200,maxHeight:160,overflowY:"auto"}}>{matches.slice(0,6).map(m=><div key={m} onMouseDown={()=>{onChange(m);setOpen(false);}} style={{padding:"10px 14px",fontSize:14,cursor:"pointer",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.target.style.background="#f5f5f5"} onMouseLeave={e=>e.target.style.background="#fff"}>📍 {m}</div>)}</div>}</div>;
}

function SigCanvas({onSave,onCancel,label}){
  const canvasRef=useRef(null),drawing=useRef(false),lastPos=useRef(null);
  const getPos=(e,canvas)=>{const r=canvas.getBoundingClientRect(),scaleX=canvas.width/r.width,scaleY=canvas.height/r.height,src=e.touches?e.touches[0]:e;return{x:(src.clientX-r.left)*scaleX,y:(src.clientY-r.top)*scaleY};};
  const start=e=>{e.preventDefault();drawing.current=true;const pos=getPos(e,canvasRef.current);lastPos.current=pos;const ctx=canvasRef.current.getContext("2d");ctx.beginPath();ctx.arc(pos.x,pos.y,1.5,0,Math.PI*2);ctx.fillStyle="#000";ctx.fill();};
  const move=e=>{e.preventDefault();if(!drawing.current)return;const canvas=canvasRef.current,ctx=canvas.getContext("2d"),pos=getPos(e,canvas);ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle="#000";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.stroke();lastPos.current=pos;};
  const end=()=>{drawing.current=false;};
  const drawGuide=useCallback(()=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle="#ddd";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,160);ctx.lineTo(canvas.width-20,160);ctx.stroke();ctx.fillStyle="#ccc";ctx.font="13px serif";ctx.fillText("✕",22,158);},[]);
  useEffect(()=>{drawGuide();},[drawGuide]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:"100%",maxWidth:480}}>
        <p style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:DR,marginBottom:8}}>{label}</p>
        <p style={{fontSize:12,color:"#666",marginBottom:12}}>Sign with finger or stylus — draw directly on the pad below</p>
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

function PinModal({title,subtitle,error,onDone,onCancel}){
  const [digits,setDigits]=useState([]);
  const add=d=>{if(digits.length>=4)return;const n=[...digits,d];setDigits(n);if(n.length===4)setTimeout(()=>{setDigits([]);onDone(n.join(""));},120);};
  const del=()=>setDigits(d=>d.slice(0,-1));
  const keys=["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:1100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:320,textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.5)"}}>
        <div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:20,color:DR,marginBottom:4}}>{title}</div>
        {subtitle&&<div style={{fontSize:13,color:"#888",marginBottom:20}}>{subtitle}</div>}
        <div style={{display:"flex",justifyContent:"center",gap:14,margin:"20px 0"}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:18,height:18,borderRadius:"50%",background:digits.length>i?NV:"#e5e7eb",border:"2px solid",borderColor:digits.length>i?NV:"#d1d5db",transition:"background 0.15s"}}/>)}
        </div>
        {error&&<div style={{background:"#FEF2F2",color:"#991b1b",borderRadius:8,padding:"8px 12px",fontSize:13,fontWeight:600,marginBottom:14}}>{error}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {keys.map((k,i)=>k===""?<div key={i}/>:<button key={i} onClick={k==="⌫"?del:()=>add(k)} style={{padding:"16px 0",fontSize:k==="⌫"?20:22,fontWeight:700,border:"1.5px solid #e5e7eb",borderRadius:12,background:k==="⌫"?"#f4f4f4":"#fff",color:k==="⌫"?"#666":"#1a1a1a",cursor:"pointer",lineHeight:1}}>{k}</button>)}
        </div>
        <button onClick={onCancel} style={{width:"100%",background:"none",border:"none",color:"#bbb",fontSize:13,cursor:"pointer",padding:8}}>Cancel</button>
      </div>
    </div>
  );
}

function LoginScreen({drivers,driverPins,adminPin,onLogin,onAdmin,onSavePin}){
  const [selected,setSelected]=useState("");
  const [err,setErr]=useState("");
  const [pinStep,setPinStep]=useState(null);
  const [pendingPin,setPendingPin]=useState("");
  const [pinError,setPinError]=useState("");

  const startLogin=()=>{
    if(!selected){setErr("Please select your name");return;}
    setErr("");setPinError("");setPendingPin("");
    if(driverPins[selected]){setPinStep("driver-enter");}
    else{setPinStep("driver-create");}
  };

  const handlePinDone=pin=>{
    setPinError("");
    if(pinStep==="driver-create"){setPendingPin(pin);setPinStep("driver-confirm");}
    else if(pinStep==="driver-confirm"){
      if(pin===pendingPin){onSavePin(selected,pin);setPinStep(null);onLogin(selected);}
      else{setPinError("PINs don't match — try again");setPendingPin("");setPinStep("driver-create");}
    }
    else if(pinStep==="driver-enter"){
      if(pin===driverPins[selected]){setPinStep(null);onLogin(selected);}
      else{setPinError("Wrong PIN — try again");}
    }
    else if(pinStep==="admin-enter"){
      if(pin===adminPin){setPinStep(null);onAdmin();}
      else{setPinError("Wrong admin PIN");}
    }
  };

  const PIN_TITLES={"driver-create":"Create Your PIN","driver-confirm":"Confirm Your PIN","driver-enter":"Enter Your PIN","admin-enter":"Admin PIN Required"};
  const PIN_SUBS={"driver-create":`First time setup for ${selected}`,"driver-confirm":"Re-enter the same PIN to confirm","driver-enter":`Welcome back, ${selected}`,"admin-enter":"Enter master admin PIN to continue"};

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
        <p style={{color:"#888",fontSize:13,margin:"0 0 20px"}}>Select your name to begin</p>
        <label style={S.lbl}>Your Name</label>
        <select value={selected} onChange={e=>{setSelected(e.target.value);setErr("");}} style={S.sel}>
          <option value="">-- Select Driver --</option>
          {drivers.map(d=>{const n=getName(d);return <option key={n} value={n}>{n}</option>;})}
        </select>
        {err&&<p style={{color:R,fontSize:12,margin:"6px 0 0"}}>{err}</p>}
        <button onClick={startLogin} style={{...S.btn,background:R,color:"#fff",marginTop:20,width:"100%",fontSize:17}}>Clock In &amp; Start</button>
        <button onClick={()=>{setPinError("");setPendingPin("");setPinStep("admin-enter");}} style={{marginTop:10,width:"100%",background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",padding:8}}>Admin / Settings ›</button>
      </div>
      <p style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginTop:24}}>Bob Sanders 618-818-8225 • Glenn Sanders 618-779-6576</p>
      {pinStep&&<PinModal title={PIN_TITLES[pinStep]} subtitle={PIN_SUBS[pinStep]} error={pinError} onDone={handlePinDone} onCancel={()=>{setPinStep(null);setPinError("");setPendingPin("");}}/>}
    </div>
  );
}

function Dashboard({driver,onNewWO,onQueue,onReports,onLogout,onEndOfDay,workOrders}){
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{icon:"📋",label:"Queue",sub:`${workOrders.length}`,action:onQueue},{icon:"📊",label:"Reports",sub:"Daily/Wkly",action:onReports}].map(a=><button key={a.label} onClick={a.action} style={{background:"#fff",border:"none",borderRadius:14,padding:"16px 10px",cursor:"pointer",textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}><div style={{fontSize:24,marginBottom:4}}>{a.icon}</div><div style={{fontWeight:700,color:"#1a1a1a",fontSize:13}}>{a.label}</div><div style={{color:"#888",fontSize:11,marginTop:2}}>{a.sub}</div></button>)}
        </div>
        {todayWOs.length>0&&<div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}><h3 style={{margin:"0 0 12px",fontSize:12,color:"#555",fontWeight:800,letterSpacing:1}}>TODAY'S TICKETS</h3>{todayWOs.slice(-5).reverse().map((wo,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<Math.min(todayWOs.length,5)-1?"1px solid #f0f0f0":"none"}}><div><div style={{fontWeight:600,fontSize:13}}>{wo.workOrderNumber}</div><div style={{color:"#888",fontSize:12}}>{wo.companyWorkedFor||"—"} • {wo.topMaterial}</div></div><span style={{background:wo.status==="complete"?"#dcfce7":"#fef9c3",color:wo.status==="complete"?"#166534":"#854d0e",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{wo.status==="complete"?"✓ Signed":"Draft"}</span></div>)}</div>}
      </div>
    </div>
  );
}

function AdminScreen({onBack,drivers,companies,quarries,workOrders,fuelLogs=[],onSave,onLoadSample,onClearSample,adminPin,driverPins,onChangeAdminPin,onResetDriverPin}){
  const [tab,setTab]=useState("companies");
  const [localDrivers,setLocalDrivers]=useState(()=>drivers.map(normDriver));
  const [localCompanies,setLocalCompanies]=useState(()=>companies.map(normCompany));
  const [localQuarries,setLocalQuarries]=useState(()=>quarries.map(normQuarry));
  const [editModal,setEditModal]=useState(null);
  const [savedMsg,setSavedMsg]=useState("");
  const [reportView,setReportView]=useState("weekly"),[reportDriver,setReportDriver]=useState("all");
  const [exportMsg,setExportMsg]=useState("");
  const [secPinStep,setSecPinStep]=useState(null);
  const [secPendingPin,setSecPendingPin]=useState("");
  const [secPinError,setSecPinError]=useState("");
  const [secMsg,setSecMsg]=useState("");

  const showSaved=()=>{setSavedMsg("✓ Saved!");setTimeout(()=>setSavedMsg(""),2200);};
  const showSecMsg=m=>{setSecMsg(m);setTimeout(()=>setSecMsg(""),3000);};
  const autoSave=(d,c,q)=>{onSave({drivers:d||localDrivers,companies:c||localCompanies,quarries:q||localQuarries});showSaved();};

  const handleContactSave=saved=>{
    const{type,idx}=editModal;
    if(type==="driver"){const u=[...localDrivers];if(idx!==null)u[idx]=saved;else u.push(saved);setLocalDrivers(u);autoSave(u,null,null);}
    else if(type==="company"){const u=[...localCompanies];if(idx!==null)u[idx]=saved;else u.push(saved);setLocalCompanies(u);autoSave(null,u,null);}
    else{const u=[...localQuarries];if(idx!==null)u[idx]=saved;else u.push(saved);setLocalQuarries(u);autoSave(null,null,u);}
    setEditModal(null);
  };
  const handleContactDelete=()=>{
    const{type,idx}=editModal;
    if(type==="driver"){const u=localDrivers.filter((_,i)=>i!==idx);setLocalDrivers(u);autoSave(u,null,null);}
    else if(type==="company"){const u=localCompanies.filter((_,i)=>i!==idx);setLocalCompanies(u);autoSave(null,u,null);}
    else{const u=localQuarries.filter((_,i)=>i!==idx);setLocalQuarries(u);autoSave(null,null,u);}
    setEditModal(null);
  };

  const now=new Date();
  const filterWOs=()=>{let f=[...workOrders];if(reportDriver!=="all")f=f.filter(w=>w.driver===reportDriver);if(reportView==="daily"){const t=nowDate();f=f.filter(w=>w.date===t);}else if(reportView==="weekly"){const ws=new Date();ws.setDate(ws.getDate()-ws.getDay());ws.setHours(0,0,0,0);f=f.filter(w=>new Date(w.date+"T00:00:00")>=ws);}else if(reportView==="monthly"){f=f.filter(w=>{const d=new Date(w.date+"T00:00:00");return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});}else{f=f.filter(w=>new Date(w.date+"T00:00:00").getFullYear()===now.getFullYear());}return f;};
  const reportWOs=filterWOs();
  const totalST=reportWOs.reduce((a,w)=>a+parseFloat(w.straightTime||0),0);
  const totalOT=reportWOs.reduce((a,w)=>a+parseFloat(w.overtime||0),0);
  const byDriver={};
  reportWOs.forEach(w=>{if(!byDriver[w.driver])byDriver[w.driver]={count:0,st:0,ot:0,gallons:0,companies:new Set(),trucks:new Set()};const d=byDriver[w.driver];d.count++;d.st+=parseFloat(w.straightTime||0);d.ot+=parseFloat(w.overtime||0);d.gallons+=parseFloat(w.gallons||0);if(w.companyWorkedFor)d.companies.add(w.companyWorkedFor);if(w.truckNumber)d.trucks.add(w.truckNumber);});

  const doExportCSV=async()=>{const rows=[["WO Number","Date","Driver","Truck","Company","Material","From","To","Arrived","Released","Straight Hrs","OT Hrs","Rate/Hr","Rate/Load","Remarks"],...reportWOs.map(w=>[w.workOrderNumber,w.date,w.driver,w.truckNumber,w.companyWorkedFor,[w.topMaterial,w.materialHauled].filter(Boolean).join(" > "),w.fromLocation,w.toLocation,w.arrivedTime,w.releasedTime,w.straightTime,w.overtimeEnabled?(w.overtime||""):"",w.ratePerHour,w.ratePerLoad,w.remarks])];const csv=rows.map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");await exportFile(csv,`RJS-Report-${reportView}-${nowDate()}.csv`,"text/csv;charset=utf-8;",m=>{setExportMsg(m);setTimeout(()=>setExportMsg(""),5000);});};

  const handleSecPinDone=pin=>{setSecPinError("");if(secPinStep==="new"){setSecPendingPin(pin);setSecPinStep("confirm");}else if(secPinStep==="confirm"){if(pin===secPendingPin){onChangeAdminPin(pin);setSecPinStep(null);setSecPendingPin("");showSecMsg("✓ Admin PIN updated!");}else{setSecPinError("PINs don't match — try again");setSecPinStep("new");setSecPendingPin("");}}};

  const TABS=[{id:"companies",label:"🏢 Companies"},{id:"drivers",label:"👷 Drivers"},{id:"quarries",label:"🪨 Quarries"},{id:"reports",label:"📊 Reports"},{id:"security",label:"🔐 Security"}];
  const modalData=editModal&&editModal.idx!==null?{driver:localDrivers,company:localCompanies,quarry:localQuarries}[editModal.type]?.[editModal.idx]:null;

  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <Header title="Admin / Settings" onBack={onBack}/>
      {savedMsg&&<div style={{background:"#dcfce7",color:"#166534",padding:"8px 16px",textAlign:"center",fontSize:13,fontWeight:700,borderBottom:"1px solid #86efac"}}>{savedMsg}</div>}
      <div style={{display:"flex",background:"#fff",borderBottom:"2px solid #f0f0f0",overflowX:"auto"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"12px 4px",border:"none",background:"none",color:tab===t.id?R:"#666",fontWeight:tab===t.id?800:500,fontSize:12,cursor:"pointer",borderBottom:tab===t.id?`3px solid ${R}`:"3px solid transparent",whiteSpace:"nowrap",minWidth:72}}>{t.label}</button>)}
      </div>
      <div style={{padding:"16px 20px 100px"}}>
        {tab==="companies"&&<>
          <p style={{fontSize:12,color:"#666",margin:"0 0 12px"}}>Tap <strong>Edit</strong> to add address, phone, email, text, primary contact, and billing/AP details.</p>
          {localCompanies.map((co,i)=>(<ContactListCard key={i} icon="🏢" name={co.name} info={[[co.phone,co.email].filter(Boolean).join(" • "),co.address].filter(Boolean)} badges={[co.contact?.name&&{label:`👤 ${co.contact.name}`,bg:"#EEF2FF",color:NV},co.billing?.name&&{label:`💳 ${co.billing.name}`,bg:"#F0FDF4",color:"#166534"}].filter(Boolean)} onEdit={()=>setEditModal({type:"company",idx:i})}/>))}
          <button onClick={()=>setEditModal({type:"company",idx:null})} style={{...S.btn,background:R,color:"#fff",width:"100%",padding:14,fontSize:15}}>+ Add Company</button>
        </>}
        {tab==="drivers"&&<>
          <p style={{fontSize:12,color:"#666",margin:"0 0 12px"}}>Tap <strong>Edit</strong> to add address, phone, email, text, CDL #, and emergency contact.</p>
          {localDrivers.map((d,i)=>(<ContactListCard key={i} icon="👷" name={d.name} info={[[d.phone,d.email].filter(Boolean).join(" • "),d.address,d.emergency?.name?`🚨 Emergency: ${d.emergency.name}${d.emergency.phone?" — "+d.emergency.phone:""}`:null].filter(Boolean)} badges={[d.license&&{label:`🪪 ${d.license}`,bg:"#FFF7ED",color:"#92400E"}].filter(Boolean)} onEdit={()=>setEditModal({type:"driver",idx:i})}/>))}
          <button onClick={()=>setEditModal({type:"driver",idx:null})} style={{...S.btn,background:R,color:"#fff",width:"100%",padding:14,fontSize:15}}>+ Add Driver</button>
        </>}
        {tab==="quarries"&&<>
          <p style={{fontSize:12,color:"#666",margin:"0 0 12px"}}>Tap <strong>Edit</strong> to add main office, accounts payable, and scale/dispatch contacts.</p>
          {localQuarries.map((q,i)=>(<ContactListCard key={i} icon="🪨" name={q.name} info={[[q.phone,q.email].filter(Boolean).join(" • "),q.address].filter(Boolean)} badges={[q.ap?.name&&{label:`💳 AP: ${q.ap.name}`,bg:"#F0FDF4",color:"#166534"},q.dispatch?.name&&{label:`⚖️ ${q.dispatch.name}`,bg:"#EEF2FF",color:NV}].filter(Boolean)} onEdit={()=>setEditModal({type:"quarry",idx:i})}/>))}
          <button onClick={()=>setEditModal({type:"quarry",idx:null})} style={{...S.btn,background:R,color:"#fff",width:"100%",padding:14,fontSize:15}}>+ Add Quarry</button>
        </>}
        {tab==="reports"&&<>
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}>
            <p style={{margin:"0 0 10px",fontWeight:800,fontSize:11,color:"#888",letterSpacing:1}}>TIME PERIOD</p>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{[["daily","Day"],["weekly","Week"],["monthly","Month"],["yearly","Year"]].map(([v,l])=><button key={v} onClick={()=>setReportView(v)} style={{padding:"7px 14px",borderRadius:20,border:"none",background:reportView===v?R:"#f0f0f0",color:reportView===v?"#fff":"#333",fontWeight:600,fontSize:13,cursor:"pointer"}}>{l}</button>)}</div>
            <select value={reportDriver} onChange={e=>setReportDriver(e.target.value)} style={S.sel}><option value="all">All Drivers</option>{localDrivers.map(d=><option key={getName(d)} value={getName(d)}>{getName(d)}</option>)}</select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>{[{label:"Tickets",val:reportWOs.length,color:DR},{label:"Straight Hrs",val:totalST.toFixed(1),color:NV},{label:"OT Hrs",val:totalOT.toFixed(1),color:R},{label:"Gallons",val:reportWOs.reduce((a,w)=>a+parseFloat(w.gallons||0),0).toFixed(0),color:"#92400E"}].map(s=><div key={s.label} style={{background:"#fff",borderRadius:12,padding:14,textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}><div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div></div>)}</div>
          {Object.keys(byDriver).length>0&&<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}><h3 style={{margin:"0 0 12px",fontSize:12,color:"#555",fontWeight:800,letterSpacing:1}}>DRIVER BREAKDOWN</h3>{Object.entries(byDriver).sort((a,b)=>b[1].st-a[1].st).map(([d,data])=><div key={d} style={{padding:"14px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><div style={{fontWeight:800,fontSize:15}}>{d}</div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:NV,fontSize:15}}>{data.st.toFixed(2)}h ST</div>{data.ot>0&&<div style={{color:R,fontSize:12,fontWeight:600}}>{data.ot.toFixed(2)}h OT</div>}</div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span style={{background:"#EEF2FF",color:NV,fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6}}>📋 {data.count} tickets</span>{data.gallons>0&&<span style={{background:"#FFF7ED",color:"#92400E",fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6}}>⛽ {data.gallons.toFixed(0)} gal</span>}</div></div>)}</div>}
          <button onClick={doExportCSV} style={{...S.btn,background:"#166534",color:"#fff",width:"100%",fontSize:16,padding:16}}>📊 Export to Excel / CSV</button>
          {exportMsg&&<div style={{marginTop:10,background:"#EEF2FF",borderRadius:8,padding:"10px 12px",fontSize:13,color:NV,textAlign:"center",fontWeight:600}}>{exportMsg}</div>}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginTop:16,border:"2px dashed #d1d5db"}}>
            <p style={{margin:"0 0 6px",fontWeight:800,fontSize:12,color:"#666",letterSpacing:1}}>🧪 DEMO / SAMPLE DATA</p>
            <p style={{margin:"0 0 12px",fontSize:12,color:"#888"}}>Load 20 sample work orders to preview reports. Clear when going live.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={onLoadSample} style={{flex:1,...S.btn,background:"#F0FDF4",color:"#166534",border:"1.5px solid #bbf7d0",fontSize:13,padding:12}}>✅ Load Sample</button>
              <button onClick={()=>{if(window.confirm("Remove all sample data?"))onClearSample();}} style={{flex:1,...S.btn,background:"#FEF2F2",color:"#991b1b",border:"1.5px solid #fecaca",fontSize:13,padding:12}}>🗑 Clear Sample</button>
            </div>
            {workOrders.filter(w=>w.isSampleData).length>0&&<p style={{margin:"10px 0 0",fontSize:11,color:"#059669",textAlign:"center"}}>✓ {workOrders.filter(w=>w.isSampleData).length} sample tickets loaded</p>}
          </div>
        </>}
        {tab==="security"&&<>
          {secMsg&&<div style={{background:"#dcfce7",color:"#166534",borderRadius:10,padding:"10px 14px",marginBottom:14,fontWeight:700,fontSize:13,textAlign:"center"}}>{secMsg}</div>}
          <Section title="ADMIN PIN" icon="🔐">
            <p style={{fontSize:13,color:"#555",margin:"0 0 12px"}}>The master admin PIN controls access to this Admin panel. Default is <strong>1234</strong> — change it now.</p>
            <div style={{background:"#EEF2FF",borderRadius:10,padding:12,marginBottom:14,fontSize:13,color:NV,fontWeight:600,textAlign:"center"}}>Current PIN: {"•".repeat(adminPin.length)} ({adminPin.length} digits)</div>
            <button onClick={()=>{setSecPinError("");setSecPendingPin("");setSecPinStep("new");}} style={{...S.btn,background:NV,color:"#fff",width:"100%",fontSize:15,padding:14}}>🔒 Change Admin PIN</button>
          </Section>
          <Section title="DRIVER PINs" icon="👷">
            <p style={{fontSize:13,color:"#555",margin:"0 0 12px"}}>Reset a driver's PIN so they can create a new one on their next sign-in.</p>
            {localDrivers.map((d,i)=>{const n=getName(d);const hasPin=!!driverPins[n];return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div><div style={{fontWeight:700,fontSize:14}}>{n}</div><div style={{fontSize:12,color:hasPin?"#166534":"#92400E",fontWeight:600}}>{hasPin?"🔒 PIN set":"⚠️ No PIN yet"}</div></div>{hasPin&&<button onClick={()=>{if(window.confirm(`Reset PIN for ${n}? They will create a new one on next sign-in.`))onResetDriverPin(n);}} style={{...S.btn,background:"#FEF2F2",color:"#991b1b",border:"1.5px solid #fecaca",padding:"7px 14px",fontSize:12}}>Reset</button>}</div>);})}
          </Section>
          {secPinStep&&<PinModal title={secPinStep==="new"?"New Admin PIN":"Confirm New PIN"} subtitle={secPinStep==="new"?"Enter a new 4-digit master PIN":"Enter the same PIN again to confirm"} error={secPinError} onDone={handleSecPinDone} onCancel={()=>{setSecPinStep(null);setSecPinError("");setSecPendingPin("");}}/>}
        </>}
      </div>
      {editModal&&(<ContactEditModal type={editModal.type} data={modalData} onSave={handleContactSave} onDelete={editModal.idx!==null?handleContactDelete:undefined} onClose={()=>setEditModal(null)}/>)}
    </div>
  );
}

function WorkOrderForm({driver,quarries,companies,savedLocations=[],onSubmit,onCancel}){
  const [form,setForm]=useState({workOrderNumber:nextWoNum(),date:nowDate(),equipmentType:"Dump",truckNumber:"",jobName:"",jobNumber:"",topMaterial:"",materialHauled:"",quarryKnown:null,quarry:"",quarryMaterialName:"",quarryMaterialCode:"",quarryMaterialPrice:"",arrivedTime:"",releasedTime:"",lunchWorked:null,overtimeEnabled:false,straightTime:"",overtime:"",fromLocation:"",toLocation:"",companyWorkedFor:"",companyAddress:"",companyPhone:"",companyContactName:"",companyContactPhone:"",companyContactEmail:"",companyBillingName:"",companyBillingPhone:"",companyBillingEmail:"",ratePerHour:"",ratePerLoad:"",gallons:"",remarks:"",driver,});
  const [errors,setErrors]=useState({});
  const [showNewQuarry,setShowNewQuarry]=useState(false),[newQuarryName,setNewQuarryName]=useState("");
  const [localQuarries,setLocalQuarries]=useState(()=>quarries.map(normQuarry));
  const set=useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);
  const setMany=useCallback(obj=>setForm(f=>({...f,...obj})),[]);
  useEffect(()=>{if(form.arrivedTime&&form.releasedTime){const st=calcStraight(form.arrivedTime,form.releasedTime,form.lunchWorked);setForm(f=>({...f,straightTime:st}));}},[form.arrivedTime,form.releasedTime,form.lunchWorked]);
  const handleCompanyPick=useCallback(name=>{const co=companies.map(normCompany).find(c=>c.name===name);if(co){setMany({companyWorkedFor:co.name,companyAddress:co.address||"",companyPhone:co.phone||"",companyContactName:co.contact?.name||"",companyContactPhone:co.contact?.phone||"",companyContactEmail:co.contact?.email||"",companyBillingName:co.billing?.name||"",companyBillingPhone:co.billing?.phone||"",companyBillingEmail:co.billing?.email||""});}else setMany({companyWorkedFor:name});},[companies,setMany]);
  const validate=()=>{const e={};if(!form.truckNumber)e.truckNumber="Required";if(!form.companyWorkedFor)e.companyWorkedFor="Required";if(!form.topMaterial)e.topMaterial="Required";if(!form.arrivedTime)e.arrivedTime="Required";if(!form.releasedTime)e.releasedTime="Required";setErrors(e);return Object.keys(e).length===0;};
  const needsQuarry=QUARRY_MATERIALS_MAP.includes(form.topMaterial);
  const qObj=localQuarries.find(q=>getName(q)===form.quarry);
  const qDB=QUARRY_DB[form.quarry];
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <Header title="New Work Order" sub={`${form.workOrderNumber} • ${driver}`} onBack={onCancel}/>
      <div style={{padding:"16px 20px 100px"}}>
        <Section title="WORK ORDER INFO" icon="📋">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Date"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={S.inp}/></Field><Field label="WO Number"><input value={form.workOrderNumber} onChange={e=>set("workOrderNumber",e.target.value)} style={S.inp}/></Field></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Equipment Type"><select value={form.equipmentType} onChange={e=>set("equipmentType",e.target.value)} style={S.sel}>{EQUIP_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Truck Number" err={errors.truckNumber}><select value={form.truckNumber} onChange={e=>set("truckNumber",e.target.value)} style={{...S.sel,borderColor:errors.truckNumber?R:"#ddd"}}><option value="">-- Select --</option>{TRUCKS.map(t=><option key={t}>{t}</option>)}</select></Field></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Job Name"><input value={form.jobName} onChange={e=>set("jobName",e.target.value)} style={S.inp} placeholder="Job name"/></Field><Field label="Job Number"><input value={form.jobNumber} onChange={e=>set("jobNumber",e.target.value)} style={S.inp} placeholder="Job #"/></Field></div>
        </Section>
        <Section title="CUSTOMER / COMPANY" icon="🏢">
          <Field label="Company Worked For" err={errors.companyWorkedFor}>
            {companies.length>0&&<select value={form.companyWorkedFor} onChange={e=>handleCompanyPick(e.target.value)} style={{...S.sel,marginBottom:8,borderColor:errors.companyWorkedFor?R:"#ddd"}}><option value="">-- Select saved company --</option>{companies.map(c=>{const n=getName(c);return <option key={n} value={n}>{n}</option>;})} </select>}
            <input value={form.companyWorkedFor} onChange={e=>set("companyWorkedFor",e.target.value)} style={{...S.inp,borderColor:errors.companyWorkedFor?R:"#ddd"}} placeholder={companies.length>0?"Or type new company name":"Company name"}/>
          </Field>
          {(form.companyContactName||form.companyBillingName)&&(<div style={{background:"#EEF2FF",borderRadius:8,padding:10,marginBottom:12,fontSize:12}}>{form.companyContactName&&<div>👤 <strong>{form.companyContactName}</strong>{form.companyContactPhone?" — "+form.companyContactPhone:""}{form.companyContactEmail?" | "+form.companyContactEmail:""}</div>}{form.companyBillingName&&<div style={{marginTop:4}}>💳 Billing: <strong>{form.companyBillingName}</strong>{form.companyBillingPhone?" — "+form.companyBillingPhone:""}</div>}</div>)}
          <Field label="Address"><input value={form.companyAddress} onChange={e=>set("companyAddress",e.target.value)} style={S.inp} placeholder="Street, City, State"/></Field>
          <Field label="Phone"><input type="tel" value={form.companyPhone} onChange={e=>set("companyPhone",e.target.value)} style={S.inp} placeholder="(000) 000-0000"/></Field>
        </Section>
        <Section title="MATERIAL HAULED" icon="⛏️">
          <Field label="Material Category" err={errors.topMaterial}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>{TOP_MATERIALS.map(m=><button key={m} onClick={()=>setMany({topMaterial:m,materialHauled:"",quarry:"",quarryKnown:null,quarryMaterialName:"",quarryMaterialCode:"",quarryMaterialPrice:""})} style={{padding:"10px 8px",border:`2px solid ${form.topMaterial===m?R:"#ddd"}`,borderRadius:10,background:form.topMaterial===m?R:"#fff",color:form.topMaterial===m?"#fff":"#333",fontSize:12,fontWeight:600,cursor:"pointer"}}>{m}</button>)}</div>
          </Field>
          {form.topMaterial&&<Field label={`${form.topMaterial} — Type`}><select value={form.materialHauled} onChange={e=>set("materialHauled",e.target.value)} style={S.sel}><option value="">-- Select type --</option>{MATERIAL_TREE[form.topMaterial].map(sub=><option key={sub} value={sub}>{sub}</option>)}</select></Field>}
          {needsQuarry&&form.topMaterial&&(<div style={{background:"#FFF8F0",border:"1px solid #FBBF24",borderRadius:10,padding:14,marginTop:4}}>
            <p style={{margin:"0 0 10px",fontWeight:700,color:"#92400E",fontSize:13}}>🪨 Do you know the quarry / source?</p>
            <div style={{display:"flex",gap:10,marginBottom:12}}>{[{label:"Yes – Select Quarry",val:true},{label:"Skip",val:false}].map(opt=><button key={String(opt.val)} onClick={()=>{set("quarryKnown",opt.val);if(!opt.val)setMany({quarry:"",quarryMaterialName:"",quarryMaterialCode:"",quarryMaterialPrice:"",});}} style={{flex:1,padding:10,border:`2px solid ${form.quarryKnown===opt.val?R:"#ddd"}`,borderRadius:8,background:form.quarryKnown===opt.val?R:"#fff",color:form.quarryKnown===opt.val?"#fff":"#333",fontWeight:600,cursor:"pointer",fontSize:13}}>{opt.label}</button>)}</div>
            {form.quarryKnown===true&&<>
              <Field label="Select Quarry"><select value={form.quarry} onChange={e=>{if(e.target.value==="__add__")setShowNewQuarry(true);else setMany({quarry:e.target.value,quarryMaterialName:"",quarryMaterialCode:"",quarryMaterialPrice:""});}} style={S.sel}><option value="">-- Select Quarry --</option>{localQuarries.map(q=>{const n=getName(q);return <option key={n} value={n}>{n}</option>;})}<option value="__add__">+ Add New Quarry...</option></select></Field>
              {form.quarry&&(qObj||qDB)&&(<div style={{background:"#fff",borderRadius:8,padding:10,marginBottom:10,fontSize:11,color:"#555",border:"1px solid #e5e7eb"}}><div style={{fontWeight:700,color:"#1a1a1a"}}>{form.quarry}</div>{(qObj?.address||qDB?.address)&&<div>{qObj?.address||qDB?.address}</div>}<div style={{display:"flex",gap:12,marginTop:2,flexWrap:"wrap"}}>{(qObj?.phone||qDB?.phone)&&<span>📞 {qObj?.phone||qDB?.phone}</span>}{(qObj?.email||qDB?.email)&&<span>✉️ {qObj?.email||qDB?.email}</span>}{qObj?.text&&<span>💬 {qObj.text}</span>}</div>{qObj?.ap?.name&&<div style={{marginTop:4,color:"#166534"}}>💳 AP: {qObj.ap.name}{qObj.ap.phone?" — "+qObj.ap.phone:""}</div>}{qObj?.dispatch?.name&&<div style={{color:NV}}>⚖️ {qObj.dispatch.name}{qObj.dispatch.phone?" — "+qObj.dispatch.phone:""}</div>}{(qObj?.notes||qDB?.note)&&<div style={{color:"#999",marginTop:2}}>{qObj?.notes||qDB?.note}</div>}</div>)}
              {form.quarry&&qDB&&<Field label="Stone / Material Type"><select value={form.quarryMaterialName} onChange={e=>{const mat=qDB.materials.find(m=>m.name===e.target.value);if(mat)setMany({quarryMaterialName:mat.name,quarryMaterialCode:mat.code,quarryMaterialPrice:mat.price});else setMany({quarryMaterialName:"",quarryMaterialCode:"",quarryMaterialPrice:"",});}} style={S.sel}><option value="">-- Select stone type --</option>{qDB.materials.map(m=><option key={m.code} value={m.name}>{m.name} (#{m.code}) — ${m.price.toFixed(2)}/ton</option>)}</select>{form.quarryMaterialName&&<div style={{display:"flex",gap:8,marginTop:8}}><div style={{flex:1,background:"#EEF2FF",borderRadius:8,padding:10,textAlign:"center"}}><div style={{fontSize:10,color:"#666"}}>MATERIAL CODE</div><div style={{fontWeight:900,color:NV,fontSize:20}}>#{form.quarryMaterialCode}</div></div><div style={{flex:1,background:"#F0FDF4",borderRadius:8,padding:10,textAlign:"center"}}><div style={{fontSize:10,color:"#666"}}>GATE RATE / TON</div><div style={{fontWeight:900,color:"#166534",fontSize:20}}>${form.quarryMaterialPrice}</div></div></div>}</Field>}
            </>}
          </div>)}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><Field label="From Location"><LocationInput value={form.fromLocation} onChange={v=>set("fromLocation",v)} placeholder="Origin / quarry" savedLocations={savedLocations}/></Field><Field label="To Location"><LocationInput value={form.toLocation} onChange={v=>set("toLocation",v)} placeholder="Job site" savedLocations={savedLocations}/></Field></div>
        </Section>
        <Section title="TIME & HOURS" icon="⏱️">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Time Arrived" err={errors.arrivedTime}><input type="time" value={form.arrivedTime} onChange={e=>set("arrivedTime",e.target.value)} style={{...S.inp,borderColor:errors.arrivedTime?R:"#ddd"}}/></Field><Field label="Time Released" err={errors.releasedTime}><input type="time" value={form.releasedTime} onChange={e=>set("releasedTime",e.target.value)} style={{...S.inp,borderColor:errors.releasedTime?R:"#ddd"}}/></Field></div>
          <Field label="Lunch Break?"><div style={{display:"flex",gap:10}}>{[{label:"✓ Worked Through",val:true},{label:"Took 30-min Break",val:false}].map(opt=><button key={String(opt.val)} onClick={()=>set("lunchWorked",opt.val)} style={{flex:1,padding:"9px 4px",border:`2px solid ${form.lunchWorked===opt.val?R:"#ddd"}`,borderRadius:8,background:form.lunchWorked===opt.val?R:"#fff",color:form.lunchWorked===opt.val?"#fff":"#333",fontSize:11,fontWeight:600,cursor:"pointer"}}>{opt.label}</button>)}</div></Field>
          <div style={{background:"#EEF2FF",borderRadius:10,padding:14,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><div style={{fontWeight:800,fontSize:12,color:NV,letterSpacing:0.5}}>STRAIGHT TIME HOURS</div><div style={{fontSize:11,color:"#888"}}>Auto-calculated · edit if needed</div></div><div style={{fontSize:30,fontWeight:900,color:NV}}>{form.straightTime||"—"}</div></div><input value={form.straightTime} onChange={e=>set("straightTime",e.target.value)} style={{...S.inp,textAlign:"center",fontWeight:700,fontSize:16}} placeholder="Enter hours manually"/></div>
          <div style={{background:"#FFF7ED",borderRadius:10,padding:14,border:"1px solid #fed7aa"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:13,color:"#92400E"}}>Overtime Pay?</div><div style={{fontSize:11,color:"#b45309"}}>Enable only if this company pays OT</div></div><div onClick={()=>set("overtimeEnabled",!form.overtimeEnabled)} style={{width:48,height:26,background:form.overtimeEnabled?R:"#d1d5db",borderRadius:13,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:form.overtimeEnabled?25:3,width:20,height:20,background:"#fff",borderRadius:"50%",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/></div></div>{form.overtimeEnabled&&<div style={{marginTop:12}}><Field label="Overtime Hours"><input type="number" value={form.overtime} onChange={e=>set("overtime",e.target.value)} style={{...S.inp,textAlign:"center",fontWeight:700,fontSize:16}} placeholder="0.00" step="0.25" min="0"/></Field></div>}</div>
        </Section>
        <Section title="BILLING RATES" icon="💲">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Rate Per Hour"><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#888",pointerEvents:"none"}}>$</span><input type="number" value={form.ratePerHour} onChange={e=>set("ratePerHour",e.target.value)} style={{...S.inp,paddingLeft:26}} placeholder="0.00"/></div></Field><Field label="Rate Per Load"><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#888",pointerEvents:"none"}}>$</span><input type="number" value={form.ratePerLoad} onChange={e=>set("ratePerLoad",e.target.value)} style={{...S.inp,paddingLeft:26}} placeholder="0.00"/></div></Field></div>
          <Field label="Gallons of Fuel Used"><input type="number" value={form.gallons} onChange={e=>set("gallons",e.target.value)} style={S.inp} placeholder="0" min="0"/></Field>
          <Field label="Remarks / Notes"><textarea value={form.remarks} onChange={e=>set("remarks",e.target.value)} style={{...S.inp,height:80,resize:"vertical"}} placeholder="Any additional notes..."/></Field>
        </Section>
        <button onClick={()=>{if(validate())onSubmit(form);}} style={{...S.btn,background:R,color:"#fff",width:"100%",fontSize:17,padding:18,boxShadow:"0 8px 24px rgba(200,16,46,0.4)"}}>Continue to Signatures →</button>
      </div>
      {showNewQuarry&&<Modal title="Add New Quarry" onClose={()=>setShowNewQuarry(false)}><input value={newQuarryName} onChange={e=>setNewQuarryName(e.target.value)} style={S.inp} placeholder="Quarry name & city"/><button onClick={()=>{if(!newQuarryName.trim())return;const q={...mkQuarry(),name:newQuarryName.trim()};setLocalQuarries(p=>[...p,q]);setMany({quarry:q.name});setNewQuarryName("");setShowNewQuarry(false);}} style={{...S.btn,background:R,color:"#fff",width:"100%",marginTop:12}}>Save Quarry</button></Modal>}
    </div>
  );
}

function SignatureScreen({form,onComplete,onBack}){
  const [driverSig,setDriverSig]=useState(null),[foremanSig,setForemanSig]=useState(null),[activeCanvas,setActiveCanvas]=useState(null);
  const ready=driverSig&&foremanSig;
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <Header title="Signatures Required" sub={form.workOrderNumber} onBack={onBack}/>
      <div style={{padding:20}}>
        <div style={{background:"#FFF8F0",border:"1px solid #FBBF24",borderRadius:12,padding:14,marginBottom:20}}><p style={{margin:0,fontSize:13,color:"#92400E",fontWeight:600}}>⚠️ Both Driver and Foreman must sign before submitting.</p></div>
        {[{key:"driver",label:"Driver Signature",sub:form.driver,sig:driverSig,setSig:setDriverSig},{key:"foreman",label:"Foreman Signature",sub:"Hand phone to foreman",sig:foremanSig,setSig:setForemanSig}].map(s=>(<div key={s.key} style={{background:"#fff",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontWeight:700,fontSize:15}}>{s.label}</div><div style={{color:"#888",fontSize:12}}>{s.sub}</div></div><span style={{background:s.sig?"#dcfce7":"#fee2e2",color:s.sig?"#166534":"#991b1b",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{s.sig?"✓ Signed":"Pending"}</span></div>{s.sig?<img src={s.sig} alt={s.label} style={{width:"100%",height:80,objectFit:"contain",border:"1px solid #eee",borderRadius:8}}/>:<button onClick={()=>setActiveCanvas(s.key)} style={{...S.btn,background:NV,color:"#fff",width:"100%",fontSize:16,padding:16}}>✍ Tap to Sign</button>}{s.sig&&<button onClick={()=>s.setSig(null)} style={{marginTop:6,background:"none",border:"none",color:R,fontSize:12,cursor:"pointer"}}>Re-sign</button>}</div>))}
        <button onClick={()=>ready&&onComplete(driverSig,foremanSig)} disabled={!ready} style={{...S.btn,background:ready?R:"#d1d5db",color:"#fff",width:"100%",fontSize:17,padding:18,cursor:ready?"pointer":"not-allowed"}}>{ready?"Submit Work Order →":"Both signatures required"}</button>
      </div>
      {activeCanvas&&<SigCanvas label={activeCanvas==="driver"?`Driver: ${form.driver}`:"Foreman Signature"} onSave={sig=>{if(activeCanvas==="driver")setDriverSig(sig);else setForemanSig(sig);setActiveCanvas(null);}} onCancel={()=>setActiveCanvas(null)}/>}
    </div>
  );
}

function InvoicePreview({workOrder:wo,onClose,onNewOrder}){
  const [msg,setMsg]=useState("");
  const buildText=()=>["=================================","          RJS HAULING","  25603 Bethel Lane • Dow, IL 62022","  Bob: 618-818-8225 | Glenn: 618-779-6576","=================================",`WO #: ${wo.workOrderNumber}`,`Date: ${fmt(wo.date)}`,`Driver: ${wo.driver}`,`Truck: ${wo.truckNumber} (${wo.equipmentType})`,"---",`Job: ${wo.jobName||"—"} / ${wo.jobNumber||"—"}`,`Company: ${wo.companyWorkedFor||"—"}`,wo.companyAddress&&`Address: ${wo.companyAddress}`,wo.companyPhone&&`Phone: ${wo.companyPhone}`,wo.companyContactName&&`Contact: ${wo.companyContactName}${wo.companyContactPhone?" — "+wo.companyContactPhone:""}`,wo.companyBillingName&&`Billing: ${wo.companyBillingName}${wo.companyBillingPhone?" — "+wo.companyBillingPhone:""}`, "---",`Material: ${wo.topMaterial}${wo.materialHauled?" › "+wo.materialHauled:""}`,wo.quarry&&`Quarry: ${wo.quarry}`,wo.quarryMaterialName&&`Stone: ${wo.quarryMaterialName} #${wo.quarryMaterialCode} @ $${wo.quarryMaterialPrice}/ton`,`From: ${wo.fromLocation||"—"}`,`To: ${wo.toLocation||"—"}`,"---",`Arrived: ${wo.arrivedTime||"—"}`,`Released: ${wo.releasedTime||"—"}`,wo.lunchWorked!==null&&`Lunch: ${wo.lunchWorked?"Worked through":"Took 30-min break"}`,`Straight Hrs: ${wo.straightTime||"—"}`,wo.overtimeEnabled&&wo.overtime&&`Overtime: ${wo.overtime} hrs`,"---",wo.ratePerHour&&`Rate/Hr: $${wo.ratePerHour}`,wo.ratePerLoad&&`Rate/Load: $${wo.ratePerLoad}`,wo.gallons&&`Fuel: ${wo.gallons} gal`,wo.remarks&&`Notes: ${wo.remarks}`,"---","Signed by Driver & Foreman","=================================","TERMS: Net 30. Over 30 days = 2% service charge.","================================="].filter(Boolean).join("\n");
  const handleShare=async()=>{const text=buildText();if(navigator.share){try{await navigator.share({title:`RJS WO ${wo.workOrderNumber}`,text});return;}catch(e){}}try{await navigator.clipboard.writeText(text);setMsg("📋 Copied! Paste into any email or message.");}catch{setMsg("⚠️ Could not copy.");}setTimeout(()=>setMsg(""),4000);};
  const handleEmail=()=>window.open(`mailto:?subject=${encodeURIComponent(`RJS Work Order ${wo.workOrderNumber}`)}&body=${encodeURIComponent(buildText())}`);
  const handlePrint=async()=>await exportFile(buildText(),`RJS-${wo.workOrderNumber}.txt`,"text/plain",m=>{setMsg(m);setTimeout(()=>setMsg(""),5000);});
  const InvRow=({label,value})=>value?<div style={{display:"flex",borderBottom:"1px solid #eee",padding:"7px 0",fontSize:13}}><div style={{width:130,color:"#666",flexShrink:0,fontStyle:"italic"}}>{label}</div><div style={{fontWeight:600}}>{value}</div></div>:null;
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <div style={{background:`linear-gradient(135deg,${DR},${R})`,padding:"16px 20px",color:"#fff"}}>
        <div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:18}}>Work Order Complete ✓</div>
        <div style={{fontSize:11,opacity:0.8,marginBottom:12}}>{wo.workOrderNumber} • Review &amp; share</div>
        <div style={{display:"flex",gap:8}}>{[{label:"📤 Share",action:handleShare},{label:"✉️ Email",action:handleEmail},{label:"🖨 Download TXT",action:handlePrint}].map(a=><button key={a.label} onClick={a.action} style={{flex:1,background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"10px 4px",fontSize:12,cursor:"pointer",fontWeight:600}}>{a.label}</button>)}</div>
        {msg&&<div style={{marginTop:10,background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:600}}>{msg}</div>}
      </div>
      <div style={{padding:16}}>
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 4px 24px rgba(0,0,0,0.12)",fontFamily:"Georgia,serif"}}>
          <div style={{textAlign:"center",borderBottom:"3px solid #1a1a1a",paddingBottom:12,marginBottom:14}}>
            <div style={{fontSize:30,fontWeight:900,color:"#1a1a1a"}}>RJS Hauling</div>
            <div style={{fontSize:13,color:"#555"}}>25603 Bethel Lane • Dow, IL 62022</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:12}}><div><strong>Bob Sanders</strong><br/>618-818-8225</div><div style={{textAlign:"center",color:"#666",fontSize:10,lineHeight:1.7}}>ROCK • SAND • DIRT • ASPHALT<br/>GRAVEL • BUILDING MATERIALS<br/>STRUCTURAL DEMO</div><div style={{textAlign:"right"}}><strong>Glenn Sanders</strong><br/>618-779-6576</div></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:13}}><span><strong>No.</strong> {wo.workOrderNumber}</span><span><strong>Date:</strong> {fmt(wo.date)}</span></div>
          <InvRow label="Driver" value={wo.driver}/><InvRow label="Equipment" value={`${wo.equipmentType} — ${wo.truckNumber}`}/><InvRow label="Job Name" value={wo.jobName}/><InvRow label="Job Number" value={wo.jobNumber}/><InvRow label="Company" value={wo.companyWorkedFor}/><InvRow label="Address" value={wo.companyAddress}/><InvRow label="Phone" value={wo.companyPhone}/><InvRow label="Contact" value={wo.companyContactName?`${wo.companyContactName}${wo.companyContactPhone?" — "+wo.companyContactPhone:""}`:null}/><InvRow label="Billing" value={wo.companyBillingName?`${wo.companyBillingName}${wo.companyBillingPhone?" — "+wo.companyBillingPhone:""}`:null}/><InvRow label="Material" value={[wo.topMaterial,wo.materialHauled].filter(Boolean).join(" › ")}/><InvRow label="Quarry" value={wo.quarry}/><InvRow label="Stone Type" value={wo.quarryMaterialName?`${wo.quarryMaterialName} #${wo.quarryMaterialCode} @ $${wo.quarryMaterialPrice}/ton`:null}/><InvRow label="From" value={wo.fromLocation}/><InvRow label="To" value={wo.toLocation}/><InvRow label="Arrived" value={wo.arrivedTime}/><InvRow label="Released" value={wo.releasedTime}/><InvRow label="Lunch" value={wo.lunchWorked===true?"Worked Through":wo.lunchWorked===false?"Took 30-min Break":null}/><InvRow label="Straight Time" value={wo.straightTime?`${wo.straightTime} hrs`:null}/>{wo.overtimeEnabled&&<InvRow label="Overtime" value={wo.overtime?`${wo.overtime} hrs`:null}/>}<InvRow label="Rate / Hour" value={wo.ratePerHour?`$${wo.ratePerHour}`:null}/><InvRow label="Rate / Load" value={wo.ratePerLoad?`$${wo.ratePerLoad}`:null}/><InvRow label="Gallons Used" value={wo.gallons?`${wo.gallons} gal`:null}/><InvRow label="Remarks" value={wo.remarks}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:20}}>{[{label:"Driver",sig:wo.driverSig,name:wo.driver},{label:"Foreman",sig:wo.foremanSig,name:"Foreman"}].map(s=><div key={s.label}><div style={{fontSize:11,color:"#888",marginBottom:4}}>{s.label} Signature</div><div style={{border:"1px solid #ccc",borderRadius:6,height:70,overflow:"hidden",background:"#fafafa"}}>{s.sig&&<img src={s.sig} alt={s.label} style={{width:"100%",height:"100%",objectFit:"contain"}}/>}</div><div style={{fontSize:11,color:"#666",borderTop:"1px solid #ccc",paddingTop:4,marginTop:4}}>{s.name}</div></div>)}</div>
          <div style={{marginTop:20,paddingTop:14,borderTop:"2px solid #1a1a1a",fontSize:10,color:"#555",textAlign:"center",lineHeight:1.6}}><strong>EXCLUSIVE USE OF VEHICLE ORDERED AND PAYMENT OF CHARGES GUARANTEED BY SHIPPER</strong><br/>TERMS: net 30 Days. Accounts over 30 days subject to a 2% service charge.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}><button onClick={onClose} style={{...S.btn,background:"#fff",color:"#333",border:"1px solid #ddd"}}>View Queue</button><button onClick={onNewOrder} style={{...S.btn,background:R,color:"#fff"}}>+ New Order</button></div>
      </div>
    </div>
  );
}

function EndOfDayScreen({driver,workOrders,fuelLogs,onSaveFuelLog,onBack}){
  const today=new Date().toISOString().split("T")[0];
  const todayWOs=workOrders.filter(w=>w.driver===driver&&w.date===today&&w.status==="complete");
  const totalST=todayWOs.reduce((a,w)=>a+parseFloat(w.straightTime||0),0);
  const totalOT=todayWOs.reduce((a,w)=>a+parseFloat(w.overtime||0),0);
  const todayLog=fuelLogs.find(l=>l.driver===driver&&l.date===today);
  const [gallons,setGallons]=useState(todayLog?String(todayLog.gallons):"");
  const [truck,setTruck]=useState(todayLog?todayLog.truck:(todayWOs[0]?.truckNumber||""));
  const [notes,setNotes]=useState(todayLog?todayLog.notes:"");
  const [saved,setSaved]=useState(!!todayLog),[showConfirm,setShowConfirm]=useState(false);
  const fmtH=h=>{const hrs=Math.floor(h),mins=Math.round((h-hrs)*60);return`${hrs}h${mins>0?" "+mins+"m":""}`.trim();};
  const handleSave=()=>{if(!gallons){alert("Please enter gallons.");return;}onSaveFuelLog({driver,date:today,gallons:parseFloat(gallons),truck,notes,submittedAt:Date.now()});setSaved(true);setShowConfirm(true);setTimeout(()=>setShowConfirm(false),3000);};
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <Header title="End of Day Report" sub={driver+" — "+new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} onBack={onBack}/>
      <div style={{padding:"16px 20px 80px"}}>
        <div style={{background:`linear-gradient(135deg,${DR},${R})`,borderRadius:16,padding:20,marginBottom:16,color:"#fff"}}><div style={{fontSize:12,opacity:0.8,letterSpacing:1,marginBottom:12}}>TODAY'S HOURS SUMMARY</div><div style={{display:"flex",gap:12}}>{[{val:totalST.toFixed(2),label:"Straight Hrs"},{val:totalOT.toFixed(2),label:"Overtime Hrs"},{val:fmtH(totalST+totalOT),label:"Total",h:true}].map(s=><div key={s.label} style={{flex:1,background:s.h?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.15)",borderRadius:10,padding:14,textAlign:"center",border:s.h?"2px solid rgba(255,255,255,0.4)":"none"}}><div style={{fontSize:28,fontWeight:900}}>{s.val}</div><div style={{fontSize:11,opacity:0.85,marginTop:2}}>{s.label}</div></div>)}</div></div>
        {todayWOs.length>0&&<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}><div style={{fontSize:12,fontWeight:800,color:"#888",letterSpacing:1,marginBottom:10}}>TODAY'S TICKETS ({todayWOs.length})</div>{todayWOs.map((wo,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<todayWOs.length-1?"1px solid #f0f0f0":"none"}}><div><div style={{fontWeight:600,fontSize:13}}>{wo.workOrderNumber}</div><div style={{fontSize:12,color:"#888"}}>{wo.companyWorkedFor} • {wo.truckNumber}</div></div><div style={{textAlign:"right",fontSize:12}}><div style={{fontWeight:700,color:NV}}>{wo.straightTime}h ST</div>{wo.overtimeEnabled&&wo.overtime&&<div style={{color:R}}>+{wo.overtime}h OT</div>}</div></div>)}</div>}
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><span style={{fontSize:28}}>⛽</span><div><div style={{fontWeight:800,fontSize:16}}>Fuel Report</div><div style={{fontSize:12,color:"#888"}}>Enter gallons pumped today</div></div>{saved&&<span style={{marginLeft:"auto",background:"#dcfce7",color:"#166534",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>✓ Saved</span>}</div>
          <div style={{marginBottom:14}}><label style={S.lbl}>Truck</label><select value={truck} onChange={e=>setTruck(e.target.value)} style={S.sel}><option value="">-- Select Truck --</option>{TRUCKS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div style={{marginBottom:14}}><label style={S.lbl}>Gallons of Fuel Added</label><div style={{position:"relative"}}><input type="number" value={gallons} onChange={e=>{setGallons(e.target.value);setSaved(false);}} style={{...S.inp,fontSize:32,fontWeight:900,textAlign:"center",color:NV,padding:"16px 12px",height:80}} placeholder="0.0" step="0.1" min="0"/><span style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#888",fontWeight:600,pointerEvents:"none"}}>gal</span></div><div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>{["18.7","19.1","25.0","37.4","42.0","50.0"].map(v=><button key={v} onClick={()=>{setGallons(v);setSaved(false);}} style={{padding:"6px 12px",background:gallons===v?NV:"#f0f0f0",color:gallons===v?"#fff":"#333",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{v}</button>)}</div></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Notes (optional)</label><input value={notes} onChange={e=>{setNotes(e.target.value);setSaved(false);}} style={S.inp} placeholder="e.g. Filled at Casey's Jerseyville"/></div>
          <button onClick={handleSave} style={{...S.btn,background:saved?"#166534":R,color:"#fff",width:"100%",fontSize:17,padding:18}}>{saved?"✓ Fuel Log Saved — Update?":"Save Fuel Report & Clock Out ⛽"}</button>
        </div>
        {showConfirm&&<div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:12,padding:16,textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>✅</div><div style={{fontWeight:700,color:"#166534"}}>End of Day Complete!</div><div style={{fontSize:13,color:"#15803d",marginTop:4}}>{fmtH(totalST+totalOT)} worked • {gallons} gal fuel logged</div></div>}
      </div>
    </div>
  );
}

function QueueScreen({workOrders,onBack,onView}){
  const [filter,setFilter]=useState("all");
  const filtered=workOrders.filter(w=>filter==="all"||w.status===filter).sort((a,b)=>b.submittedAt-a.submittedAt);
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <Header title="Work Order Queue" onBack={onBack}/>
      <div style={{padding:20}}>
        <div style={{display:"flex",gap:8,marginBottom:16}}>{["all","complete","draft"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 16px",borderRadius:20,border:"none",background:filter===f?R:"#fff",color:filter===f?"#fff":"#333",fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}</div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>No work orders found</div>}
        {filtered.map((wo,i)=><div key={i} onClick={()=>onView(wo)} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.08)",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15,fontFamily:"Georgia,serif",color:DR}}>{wo.workOrderNumber}</div><div style={{color:"#888",fontSize:12,marginTop:2}}>{fmt(wo.date)} • {wo.driver}</div><div style={{fontSize:13,marginTop:4,fontWeight:600}}>{wo.companyWorkedFor||"—"}</div><div style={{color:"#555",fontSize:12}}>{wo.truckNumber} • {wo.topMaterial}</div></div><div style={{textAlign:"right"}}><span style={{background:wo.status==="complete"?"#dcfce7":"#fef9c3",color:wo.status==="complete"?"#166534":"#854d0e",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{wo.status==="complete"?"✓ Signed":"Draft"}</span>{wo.straightTime&&<div style={{fontSize:12,color:"#555",marginTop:8}}>{wo.straightTime}h{wo.overtimeEnabled&&wo.overtime?" + "+wo.overtime+"h OT":""}</div>}</div></div></div>)}
      </div>
    </div>
  );
}

function ReportsScreen({workOrders,fuelLogs=[],drivers=[],onBack}){
  const [view,setView]=useState("weekly"),[driverFilter,setDriverFilter]=useState("all");
  const [exportMsg,setExportMsg]=useState("");
  const now=new Date(),today=now.toISOString().split("T")[0];
  const fwos=()=>{let w=driverFilter!=="all"?workOrders.filter(x=>x.driver===driverFilter):[...workOrders];if(view==="daily")w=w.filter(x=>x.date===today);else if(view==="weekly"){const ws=new Date();ws.setDate(ws.getDate()-ws.getDay());ws.setHours(0,0,0,0);w=w.filter(x=>new Date(x.date+"T00:00:00")>=ws);}else if(view==="monthly")w=w.filter(x=>{const d=new Date(x.date+"T00:00:00");return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});else w=w.filter(x=>new Date(x.date+"T00:00:00").getFullYear()===now.getFullYear());return w;};
  const ffuel=()=>{let l=driverFilter!=="all"?fuelLogs.filter(x=>x.driver===driverFilter):[...fuelLogs];if(view==="daily")l=l.filter(x=>x.date===today);else if(view==="weekly"){const ws=new Date();ws.setDate(ws.getDate()-ws.getDay());ws.setHours(0,0,0,0);l=l.filter(x=>new Date(x.date+"T00:00:00")>=ws);}else if(view==="monthly")l=l.filter(x=>{const d=new Date(x.date+"T00:00:00");return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});else l=l.filter(x=>new Date(x.date+"T00:00:00").getFullYear()===now.getFullYear());return l;};
  const rWOs=fwos(),rFuel=ffuel();
  const totalST=rWOs.reduce((a,w)=>a+parseFloat(w.straightTime||0),0);
  const totalOT=rWOs.reduce((a,w)=>a+parseFloat(w.overtime||0),0);
  const totalGal=rFuel.reduce((a,l)=>a+parseFloat(l.gallons||0),0);
  const byDriver={};
  [...new Set([...rWOs.map(w=>w.driver),...rFuel.map(l=>l.driver)])].filter(Boolean).forEach(d=>{byDriver[d]={st:0,ot:0,gallons:0,earnings:0,count:0,trucks:new Set(),companies:new Set()};});
  rWOs.forEach(w=>{if(!byDriver[w.driver])return;const d=byDriver[w.driver];d.count++;d.st+=parseFloat(w.straightTime||0);d.ot+=parseFloat(w.overtime||0);if(w.ratePerHour)d.earnings+=parseFloat(w.straightTime||0)*parseFloat(w.ratePerHour)+parseFloat(w.overtime||0)*parseFloat(w.ratePerHour)*1.5;if(w.ratePerLoad)d.earnings+=parseFloat(w.ratePerLoad);if(w.truckNumber)d.trucks.add(w.truckNumber);if(w.companyWorkedFor)d.companies.add(w.companyWorkedFor);});
  rFuel.forEach(l=>{if(byDriver[l.driver])byDriver[l.driver].gallons+=parseFloat(l.gallons||0);});
  const buildText=()=>{const pl={daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Annual"}[view];return["====================================================",`        RJS HAULING — ${pl.toUpperCase()} REPORT`,`        ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`,`        Driver: ${driverFilter==="all"?"All Drivers":driverFilter}`,"====================================================",`Total Tickets:      ${rWOs.length}`,`Total Straight Hrs: ${totalST.toFixed(2)}`,`Total Overtime Hrs: ${totalOT.toFixed(2)}`,`Total Fuel (gal):   ${totalGal.toFixed(1)}`,"----------------------------------------------------","DRIVER BREAKDOWN:","----------------------------------------------------",...Object.entries(byDriver).sort((a,b)=>b[1].st-a[1].st).map(([n,d])=>[`  ${n}`,`    Tickets: ${d.count}`,`    Straight: ${d.st.toFixed(2)}h  OT: ${d.ot.toFixed(2)}h  Total: ${(d.st+d.ot).toFixed(2)}h`,`    Fuel: ${d.gallons.toFixed(1)} gal`,...(d.earnings>0?[`    Est. Earnings: $${d.earnings.toFixed(2)}`]:[]),`    Trucks: ${[...d.trucks].join(", ")||"—"}`,`    Companies: ${[...d.companies].join(", ")||"—"}`].join("\n")),"----------------------------------------------------","WORK ORDER DETAIL:","----------------------------------------------------",...rWOs.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(wo=>`  ${wo.workOrderNumber} | ${fmt(wo.date)} | ${wo.driver} | ${wo.truckNumber} | ${wo.companyWorkedFor} | ${wo.straightTime}h ST${wo.overtimeEnabled&&wo.overtime?" + "+wo.overtime+"h OT":""}`),"----------------------------------------------------","FUEL LOGS:","----------------------------------------------------",...rFuel.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>`  ${fmt(l.date)} | ${l.driver} | ${l.truck} | ${parseFloat(l.gallons).toFixed(1)} gal${l.notes?" | "+l.notes:""}`),"====================================================","RJS HAULING • 25603 Bethel Lane • Dow, IL 62022","Bob Sanders 618-818-8225 • Glenn Sanders 618-779-6576","===================================================="].join("\n");};
  const buildCSV=()=>{const wo=[["Type","WO#","Date","Driver","Truck","Company","Material","Quarry","From","To","Arrived","Released","Straight","OT","Rate/Hr","Rate/Load"],...rWOs.map(w=>["WO",w.workOrderNumber,w.date,w.driver,w.truckNumber,w.companyWorkedFor,[w.topMaterial,w.materialHauled].filter(Boolean).join(" > "),w.quarry||"",w.fromLocation,w.toLocation,w.arrivedTime,w.releasedTime,w.straightTime,w.overtimeEnabled?(w.overtime||""):"",w.ratePerHour,w.ratePerLoad])];const fuel=[[],["--- FUEL LOGS ---"],["Date","Driver","Truck","Gallons","Notes"],...rFuel.map(l=>[l.date,l.driver,l.truck,parseFloat(l.gallons).toFixed(1),l.notes||""])];const sum=[[],["--- SUMMARY ---"],["Driver","Tickets","Straight","OT","Total","Fuel","Est. Earnings"],...Object.entries(byDriver).sort((a,b)=>b[1].st-a[1].st).map(([n,d])=>[n,d.count,d.st.toFixed(2),d.ot.toFixed(2),(d.st+d.ot).toFixed(2),d.gallons.toFixed(1),d.earnings>0?d.earnings.toFixed(2):""])];return[...wo,...fuel,...sum].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");};
  const showMsg=m=>{setExportMsg(m);setTimeout(()=>setExportMsg(""),6000);};
  const doCSV=()=>exportFile(buildCSV(),`RJS-${view}-${today}.csv`,"text/csv;charset=utf-8;",showMsg);
  const doTXT=()=>exportFile(buildText(),`RJS-${view}-${today}.txt`,"text/plain",showMsg);
  const doEmail=()=>{const pl={daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Annual"}[view];window.open(`mailto:?subject=${encodeURIComponent(`RJS Hauling ${pl} Report — ${new Date().toLocaleDateString()}`)}&body=${encodeURIComponent(buildText())}`);showMsg("✅ Mail app opened.");};
  const doShare=async()=>{const text=buildText(),pl={daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Annual"}[view];if(navigator.share){try{await navigator.share({title:`RJS Hauling ${pl} Report`,text});return;}catch(e){}}try{await navigator.clipboard.writeText(text);showMsg("📋 Report copied to clipboard.");}catch{showMsg("⚠️ Could not copy. Use Download TXT instead.");}};
  const pl={daily:"Today",weekly:"This Week",monthly:"This Month",yearly:"This Year"}[view];
  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4"}}>
      <Header title="Reports" sub={`${pl} • ${driverFilter==="all"?"All Drivers":driverFilter}`} onBack={onBack}/>
      <div style={{padding:"16px 20px 80px"}}>
        <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{[["daily","Day"],["weekly","Week"],["monthly","Month"],["yearly","Year"]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{padding:"7px 18px",borderRadius:20,border:"none",background:view===v?R:"#f0f0f0",color:view===v?"#fff":"#333",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>)}</div>
          <select value={driverFilter} onChange={e=>setDriverFilter(e.target.value)} style={S.sel}><option value="all">All Drivers</option>{[...new Set([...workOrders.map(w=>w.driver),...fuelLogs.map(l=>l.driver)])].filter(Boolean).sort().map(d=><option key={d} value={d}>{d}</option>)}</select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>{[{label:"Work Orders",val:rWOs.length,color:DR,icon:"📋"},{label:"Straight Hrs",val:totalST.toFixed(2),color:NV,icon:"⏱"},{label:"Overtime Hrs",val:totalOT.toFixed(2),color:R,icon:"⚡"},{label:"Total Gallons",val:totalGal.toFixed(1),color:"#92400E",icon:"⛽"}].map(s=><div key={s.label} style={{background:"#fff",borderRadius:12,padding:14,textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}><div style={{fontSize:18,marginBottom:4}}>{s.icon}</div><div style={{fontSize:24,fontWeight:900,color:s.color}}>{s.val}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div></div>)}</div>
        {Object.keys(byDriver).length>0&&<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}><div style={{fontSize:12,fontWeight:800,color:"#888",letterSpacing:1,marginBottom:12}}>DRIVER TOTALS — {pl.toUpperCase()}</div>{Object.entries(byDriver).sort((a,b)=>b[1].st-a[1].st).map(([n,d])=><div key={n} style={{padding:"14px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontWeight:800,fontSize:15}}>{n}</div><div style={{textAlign:"right"}}><div style={{fontWeight:900,color:NV,fontSize:16}}>{(d.st+d.ot).toFixed(2)}h total</div><div style={{fontSize:11,color:"#888"}}>{d.st.toFixed(2)} ST{d.ot>0?" • "+d.ot.toFixed(2)+" OT":""}</div></div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span style={{background:"#EEF2FF",color:NV,fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6}}>📋 {d.count} tickets</span>{d.gallons>0&&<span style={{background:"#FFF7ED",color:"#92400E",fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6}}>⛽ {d.gallons.toFixed(1)} gal</span>}{d.earnings>0&&<span style={{background:"#F0FDF4",color:"#166534",fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6}}>💵 ${d.earnings.toFixed(0)}</span>}</div></div>)}</div>}
        {rFuel.length>0&&<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}><div style={{fontSize:12,fontWeight:800,color:"#888",letterSpacing:1,marginBottom:10}}>⛽ FUEL LOGS</div>{rFuel.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<rFuel.length-1?"1px solid #f0f0f0":"none"}}><div><div style={{fontWeight:600}}>{l.driver}</div><div style={{fontSize:12,color:"#888"}}>{fmt(l.date)} • {l.truck}{l.notes?" • "+l.notes:""}</div></div><div style={{fontWeight:900,color:"#92400E",fontSize:16}}>{parseFloat(l.gallons).toFixed(1)} gal</div></div>)}</div>}
        {rWOs.length===0&&rFuel.length===0&&<div style={{textAlign:"center",padding:40,color:"#bbb",background:"#fff",borderRadius:14}}>No data for this period</div>}
        <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:12,fontWeight:800,color:"#888",letterSpacing:1,marginBottom:12}}>EXPORT OPTIONS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={doCSV} style={{...S.btn,background:"#166534",color:"#fff",fontSize:13,padding:"14px 8px"}}>📊 Excel / CSV</button>
            <button onClick={doTXT} style={{...S.btn,background:NV,color:"#fff",fontSize:13,padding:"14px 8px"}}>📄 Download TXT</button>
            <button onClick={doEmail} style={{...S.btn,background:R,color:"#fff",fontSize:13,padding:"14px 8px"}}>✉️ Email Report</button>
            <button onClick={doShare} style={{...S.btn,background:"#374151",color:"#fff",fontSize:13,padding:"14px 8px"}}>📤 Share / Copy</button>
          </div>
          {exportMsg&&<div style={{marginTop:12,background:exportMsg.startsWith("✅")||exportMsg.startsWith("📋")?"#F0FDF4":"#FEF2F2",border:`1px solid ${exportMsg.startsWith("✅")||exportMsg.startsWith("📋")?"#86efac":"#fecaca"}`,borderRadius:8,padding:"12px 14px",fontSize:13,fontWeight:600,color:exportMsg.startsWith("✅")||exportMsg.startsWith("📋")?"#166534":"#991b1b",textAlign:"center"}}>{exportMsg}</div>}
        </div>
      </div>
      <Toast msg={exportMsg}/>
    </div>
  );
}

const ADMIN_PIN_DEFAULT="1234";

export default function App(){
  const [screen,setScreen]=useState("login");
  const [driver,setDriver]=useState(null);
  const [drivers,setDrivers]=useState(INIT_DRIVERS);
  const [companies,setCompanies]=useState(INIT_COMPANIES);
  const [quarries,setQuarries]=useState(INIT_QUARRIES);
  const [workOrders,setWorkOrders]=useState([]);
  const [pendingForm,setPendingForm]=useState(null);
  const [savedLocations,setSavedLocations]=useState([]);
  const [fuelLogs,setFuelLogs]=useState([]);
  const [viewingWO,setViewingWO]=useState(null);
  const [driverPins,setDriverPins]=useState({});
  const [adminPin,setAdminPin]=useState(ADMIN_PIN_DEFAULT);

  useEffect(()=>{
    (async()=>{
      try{
        const r1=await window.storage.get("rjs-work-orders");if(r1){const wos=JSON.parse(r1.value);setWorkOrders(wos);initWoNum(wos);}
        const r2=await window.storage.get("rjs-drivers");if(r2)setDrivers(JSON.parse(r2.value).map(normDriver));
        const r3=await window.storage.get("rjs-quarries");if(r3)setQuarries(JSON.parse(r3.value).map(normQuarry));
        const r4=await window.storage.get("rjs-companies");if(r4)setCompanies(JSON.parse(r4.value).map(normCompany));
        const r5=await window.storage.get("rjs-locations");if(r5)setSavedLocations(JSON.parse(r5.value));
        const r6=await window.storage.get("rjs-fuel-logs");if(r6)setFuelLogs(JSON.parse(r6.value));
        const r7=await window.storage.get("rjs-driver-pins");if(r7)setDriverPins(JSON.parse(r7.value));
        const r8=await window.storage.get("rjs-admin-pin");if(r8)setAdminPin(r8.value);
      }catch(e){}
    })();
  },[]);

  const saveWOs=async list=>{setWorkOrders(list);initWoNum(list);try{await window.storage.set("rjs-work-orders",JSON.stringify(list));}catch(e){}};
  const loadSampleData=async()=>saveWOs([...SAMPLE_WORK_ORDERS,...workOrders.filter(w=>!w.isSampleData)]);
  const clearSampleData=async()=>saveWOs(workOrders.filter(w=>!w.isSampleData));
  const saveFuelLog=async log=>{setFuelLogs(prev=>{const u=[log,...prev.filter(l=>!(l.driver===log.driver&&l.date===log.date))];window.storage.set("rjs-fuel-logs",JSON.stringify(u)).catch(()=>{});return u;});};
  const handleAdminSave=async({drivers:d,companies:c,quarries:q})=>{setDrivers(d);setCompanies(c);setQuarries(q);try{await window.storage.set("rjs-drivers",JSON.stringify(d));await window.storage.set("rjs-companies",JSON.stringify(c));await window.storage.set("rjs-quarries",JSON.stringify(q));}catch(e){}};
  const addLocation=async loc=>{if(!loc?.trim())return;setSavedLocations(prev=>{const t=loc.trim();if(prev.includes(t))return prev;const u=[t,...prev].slice(0,50);window.storage.set("rjs-locations",JSON.stringify(u)).catch(()=>{});return u;});};
  const handleSigComplete=async(driverSig,foremanSig)=>{if(pendingForm.fromLocation)addLocation(pendingForm.fromLocation);if(pendingForm.toLocation)addLocation(pendingForm.toLocation);const wo={...pendingForm,driverSig,foremanSig,status:"complete",submittedAt:Date.now()};await saveWOs([...workOrders,wo]);setViewingWO(wo);setScreen("invoice");};
  const handleSaveDriverPin=async(name,pin)=>{setDriverPins(prev=>{const u={...prev,[name]:pin};window.storage.set("rjs-driver-pins",JSON.stringify(u)).catch(()=>{});return u;});};
  const handleResetDriverPin=async(name)=>{setDriverPins(prev=>{const u={...prev};delete u[name];window.storage.set("rjs-driver-pins",JSON.stringify(u)).catch(()=>{});return u;});};
  const handleChangeAdminPin=async(pin)=>{setAdminPin(pin);try{await window.storage.set("rjs-admin-pin",pin);}catch(e){}};

  if(screen==="login") return <LoginScreen drivers={drivers} driverPins={driverPins} adminPin={adminPin} onLogin={d=>{setDriver(d);setScreen("dashboard");}} onAdmin={()=>setScreen("admin")} onSavePin={handleSaveDriverPin}/>;
  if(screen==="dashboard") return <Dashboard driver={driver} workOrders={workOrders} onNewWO={()=>setScreen("new_wo")} onQueue={()=>setScreen("queue")} onReports={()=>setScreen("reports")} onEndOfDay={()=>setScreen("eod")} onLogout={()=>{setDriver(null);setScreen("login");}}/>;
  if(screen==="admin") return <AdminScreen onBack={()=>setScreen(driver?"dashboard":"login")} drivers={drivers} companies={companies} quarries={quarries} workOrders={workOrders} fuelLogs={fuelLogs} onSave={handleAdminSave} onLoadSample={loadSampleData} onClearSample={clearSampleData} adminPin={adminPin} driverPins={driverPins} onChangeAdminPin={handleChangeAdminPin} onResetDriverPin={handleResetDriverPin}/>;
  if(screen==="new_wo") return <WorkOrderForm driver={driver} quarries={quarries} companies={companies} savedLocations={savedLocations} onSubmit={form=>{setPendingForm(form);setScreen("signatures");}} onCancel={()=>setScreen("dashboard")}/>;
  if(screen==="signatures") return <SignatureScreen form={pendingForm} onComplete={handleSigComplete} onBack={()=>setScreen("new_wo")}/>;
  if(screen==="invoice") return <InvoicePreview workOrder={viewingWO} onClose={()=>setScreen("queue")} onNewOrder={()=>setScreen("new_wo")}/>;
  if(screen==="queue") return <QueueScreen workOrders={workOrders} onBack={()=>setScreen("dashboard")} onView={wo=>{setViewingWO(wo);setScreen("invoice");}}/>;
  if(screen==="eod") return <EndOfDayScreen driver={driver} workOrders={workOrders} fuelLogs={fuelLogs} onSaveFuelLog={saveFuelLog} onBack={()=>setScreen("dashboard")}/>;
  if(screen==="reports") return <ReportsScreen workOrders={workOrders} fuelLogs={fuelLogs} drivers={drivers} onBack={()=>setScreen("dashboard")}/>;
  return null;
}
