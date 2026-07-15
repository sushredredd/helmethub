
// HelmetHub India — client runtime (no dependencies)
(function(){
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},
             set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const ROOT=document.documentElement, BASE=document.body.dataset.base||"";

/* theme */
const savedTheme=store.get("hh-theme",null)||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
ROOT.dataset.theme=savedTheme;
$("#themeBtn")?.addEventListener("click",()=>{
  ROOT.dataset.theme=ROOT.dataset.theme==="light"?"dark":"light";
  store.set("hh-theme",ROOT.dataset.theme);
});

/* mobile nav */
$("#burger")?.addEventListener("click",()=>$("#navLinks").classList.toggle("open"));

/* reveal on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
$$(".reveal").forEach(el=>io.observe(el));

/* counters */
$$("[data-count]").forEach(el=>{
  const end=+el.dataset.count, io2=new IntersectionObserver(es=>{
    if(!es[0].isIntersecting)return; io2.disconnect();
    const t0=performance.now(), dur=1200;
    const tick=t=>{const p=Math.min(1,(t-t0)/dur);el.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  },{threshold:.5}); io2.observe(el);
});

/* score bars */
$$(".sb .fill").forEach(f=>{
  const io3=new IntersectionObserver(es=>{if(es[0].isIntersecting){f.style.width=f.dataset.w+"%";io3.disconnect()}},{threshold:.4});
  io3.observe(f);
});

/* back to top */
const tt=$("#toTop");
if(tt){addEventListener("scroll",()=>tt.classList.toggle("show",scrollY>700),{passive:true});
  tt.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}))}

/* data */
let DATA=null;
async function data(){if(DATA)return DATA;const r=await fetch(BASE+"data.json");DATA=await r.json();return DATA}

/* search */
function bindSearch(input,pop){
  if(!input||!pop)return;
  input.addEventListener("input",async()=>{
    const q=input.value.trim().toLowerCase();
    if(q.length<2){pop.classList.remove("open");return}
    const d=await data();
    const hits=d.filter(h=>(h.brand+" "+h.name+" "+h.type).toLowerCase().includes(q)).slice(0,8);
    pop.innerHTML=hits.length?hits.map(h=>`<a href="${BASE}helmets/${h.slug}.html"><span>${h.brand} ${h.name}</span><span class="m">₹${h.price.toLocaleString("en-IN")}</span></a>`).join("")
      :`<a><span class="m">No helmets match "${input.value}"</span></a>`;
    pop.classList.add("open");
  });
  document.addEventListener("click",e=>{if(!pop.contains(e.target)&&e.target!==input)pop.classList.remove("open")});
}
bindSearch($("#navSearch"),$("#navPop")); bindSearch($("#heroSearch"),$("#heroPop"));

/* wishlist */
function wishInit(){
  const w=new Set(store.get("hh-wish",[]));
  $$(".wish").forEach(b=>{
    b.classList.toggle("on",w.has(b.dataset.slug));
    b.setAttribute("aria-pressed",w.has(b.dataset.slug));
    b.onclick=e=>{e.preventDefault();e.stopPropagation();
      const s=b.dataset.slug; w.has(s)?w.delete(s):w.add(s);
      store.set("hh-wish",[...w]); wishInit();};
  });
}
wishInit();

/* recently viewed */
const slugHere=document.body.dataset.slug;
if(slugHere){const rv=store.get("hh-recent",[]).filter(s=>s!==slugHere);rv.unshift(slugHere);store.set("hh-recent",rv.slice(0,8))}
const rvBox=$("#recent");
if(rvBox){(async()=>{
  const d=await data(), rv=store.get("hh-recent",[]).filter(s=>s!==slugHere).slice(0,4);
  if(!rv.length){rvBox.closest("section").style.display="none";return}
  rvBox.innerHTML=rv.map(s=>{const h=d.find(x=>x.slug===s);return h?card(h):""}).join("");
  wishInit(); drawerBind();
})()}

/* compare drawer */
function cset(){return new Set(store.get("hh-compare",[]))}
function drawerRender(){
  const dEl=$("#drawer"); if(!dEl)return;
  const c=[...cset()];
  dEl.classList.toggle("open",c.length>0);
  $("#drawerChips").innerHTML=c.map(s=>`<span class="chip">${s.replace(/-/g," ")}<button data-x="${s}" aria-label="Remove">×</button></span>`).join("");
  $("#drawerGo").href=BASE+"compare.html?ids="+c.join(",");
  $$("#drawerChips [data-x]").forEach(b=>b.onclick=()=>{const st=cset();st.delete(b.dataset.x);store.set("hh-compare",[...st]);drawerRender();syncChecks()});
}
function syncChecks(){const st=cset();$$("[data-cmp]").forEach(cb=>cb.checked=st.has(cb.dataset.cmp))}
function drawerBind(){
  $$("[data-cmp]").forEach(cb=>{cb.onchange=()=>{
    const st=cset();
    if(cb.checked){if(st.size>=4){cb.checked=false;alert("Compare up to 4 helmets at a time.");return}st.add(cb.dataset.cmp)}
    else st.delete(cb.dataset.cmp);
    store.set("hh-compare",[...st]);drawerRender();
  }});
  syncChecks();
}
drawerBind();drawerRender();
$("#drawerClear")?.addEventListener("click",()=>{store.set("hh-compare",[]);drawerRender();syncChecks()});

/* shared card template */
const rup=n=>"₹"+n.toLocaleString("en-IN");
function stars(r){const f=Math.round(r);return "★".repeat(f)+"☆".repeat(5-f)}
function card(h){
  const off=Math.round((1-h.price/h.mrp)*100);
  return `<article class="pcard reveal in">
  <a class="ph" href="${BASE}helmets/${h.slug}.html">
    <span class="badge-type">${h.type}</span>
    <button class="wish" data-slug="${h.slug}" aria-label="Save to wishlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.7-10-9.3C.4 8 2.2 4.5 5.8 4.1 8 3.9 9.9 5 12 7.2 14.1 5 16 3.9 18.2 4.1c3.6.4 5.4 3.9 3.8 7.6C19.5 16.3 12 21 12 21z"/></svg></button>
    <img src="${BASE}img/${h.slug}-1.svg" alt="${h.brand} ${h.name}" loading="lazy" width="280" height="150">
  </a>
  <div class="body">
    <span class="brand">${h.brand}</span>
    <h3><a href="${BASE}helmets/${h.slug}.html">${h.name}</a></h3>
    <div class="rate"><span class="stars" aria-hidden="true">${stars(h.rating)}</span><span>${h.rating}</span><span class="n">(${h.reviews.toLocaleString("en-IN")})</span></div>
    <div class="plate"><span class="stamp">${h.certs.join(" · ")}</span><span>${h.weight} g</span><span>${h.sizes.join("/")}</span></div>
    <div class="price"><b>${rup(h.price)}</b><s>${rup(h.mrp)}</s><span class="off">${off}% off</span></div>
    <div class="acts">
      <a class="btn btn-ghost btn-sm" href="${BASE}helmets/${h.slug}.html">Details</a>
      <a class="btn btn-amz btn-sm" href="https://www.amazon.in/dp/${h.asin}?tag=YOURAFFILIATETAG-21" rel="nofollow sponsored noopener" target="_blank">Buy on Amazon</a>
    </div>
    <label class="chk"><input type="checkbox" data-cmp="${h.slug}"> Add to compare</label>
  </div></article>`;
}
window.HH={data,card,wishInit,drawerBind,drawerRender,rup,stars,BASE};

/* ---------- browse page ---------- */
const grid=$("#grid");
if(grid){(async()=>{
  const d=await data();
  const params=new URLSearchParams(location.search);
  const state={brand:new Set(),type:new Set(),cert:new Set(),shell:new Set(),feat:new Set(),
               price:20000,weight:1700,sort:"pop",q:(params.get("q")||"").toLowerCase()};
  if(params.get("type"))state.type.add(params.get("type"));
  if(params.get("brand"))state.brand.add(params.get("brand"));
  // build filter groups
  const certsAll=["ISI","DOT","ECE 22.05","ECE 22.06"];
  const shellsAll=[...new Set(d.map(h=>h.shell))];
  const featAll=[["pinlock","Pinlock Ready"],["bluetooth","Bluetooth Ready"],["dd","Double D-Ring"],["mm","Micrometric Buckle"],["sv","Inner Sun Visor"]];
  function group(id,items,checked){
    return items.map(([v,l])=>`<label><input type="checkbox" data-g="${id}" value="${v}" ${checked&&checked.has(v)?"checked":""}> ${l}</label>`).join("");
  }
  $("#fBrand").innerHTML=group("brand",[...new Set(d.map(h=>h.brand))].sort().map(b=>[b,b]),state.brand);
  $("#fType").innerHTML=group("type",[...new Set(d.map(h=>h.type))].map(t=>[t,t]),state.type);
  $("#fCert").innerHTML=group("cert",certsAll.map(c=>[c,c]));
  $("#fShell").innerHTML=group("shell",shellsAll.map(s=>[s,s]));
  $("#fFeat").innerHTML=group("feat",featAll);
  function hasFeat(h,f){return f==="pinlock"?h.pinlock:f==="bluetooth"?h.bluetooth:
    f==="dd"?h.closure==="Double D-Ring":f==="mm"?h.closure==="Micrometric Buckle":
    f==="sv"?h.visor.includes("Sun Visor"):true}
  function apply(){
    let out=d.filter(h=>
      (!state.brand.size||state.brand.has(h.brand))&&
      (!state.type.size||state.type.has(h.type))&&
      (!state.cert.size||[...state.cert].every(c=>h.certs.includes(c)))&&
      (!state.shell.size||state.shell.has(h.shell))&&
      [...state.feat].every(f=>hasFeat(h,f))&&
      h.price<=state.price&&h.weight<=state.weight&&
      (!state.q||(h.brand+" "+h.name+" "+h.type).toLowerCase().includes(state.q)));
    const s={pop:(a,b)=>b.reviews-a.reviews,"price-a":(a,b)=>a.price-b.price,"price-d":(a,b)=>b.price-a.price,
             rating:(a,b)=>b.rating-a.rating,weight:(a,b)=>a.weight-b.weight}[state.sort];
    out.sort(s);
    $("#count").textContent=out.length+" of "+d.length+" helmets";
    grid.innerHTML=out.length?out.map(card).join(""):`<p class="notice">No helmets match these filters. Try widening the price or weight range.</p>`;
    wishInit();drawerBind();
  }
  $("#filters").addEventListener("change",e=>{
    const t=e.target; if(t.dataset.g){const set=state[t.dataset.g];t.checked?set.add(t.value):set.delete(t.value);apply()}
  });
  $("#fPrice").addEventListener("input",e=>{state.price=+e.target.value;$("#fPriceV").textContent=rup(state.price);apply()});
  $("#fWeight").addEventListener("input",e=>{state.weight=+e.target.value;$("#fWeightV").textContent=state.weight+" g";apply()});
  $("#sort").addEventListener("change",e=>{state.sort=e.target.value;apply()});
  $("#ftoggle")?.addEventListener("click",()=>$("#filters").classList.toggle("open"));
  apply();
})()}

/* ---------- compare page ---------- */
const cmpT=$("#cmpTable");
if(cmpT){(async()=>{
  const d=await data();
  let ids=(new URLSearchParams(location.search).get("ids")||"").split(",").filter(Boolean);
  if(!ids.length)ids=store.get("hh-compare",[]);
  ids=ids.filter(s=>d.some(h=>h.slug===s)).slice(0,4);
  const picks=$("#picks");
  function sel(i){
    const cur=ids[i]||"";
    return `<select data-i="${i}" aria-label="Helmet ${i+1}"><option value="">— Select helmet ${i+1} —</option>`+
      d.map(h=>`<option value="${h.slug}" ${h.slug===cur?"selected":""}>${h.brand} ${h.name} (${"₹"+h.price.toLocaleString("en-IN")})</option>`).join("")+"</select>";
  }
  function render(){
    picks.innerHTML=[0,1,2,3].map(sel).join("");
    $$("select",picks).forEach(s=>s.onchange=()=>{ids[+s.dataset.i]=s.value;ids=ids.filter(Boolean);store.set("hh-compare",ids);
      history.replaceState(null,"","?ids="+ids.join(","));render()});
    const hs=ids.map(s=>d.find(h=>h.slug===s)).filter(Boolean);
    if(hs.length<2){cmpT.innerHTML=`<p class="notice">Select at least two helmets above to compare them side by side.</p>`;return}
    const min=f=>Math.min(...hs.map(f)), max=f=>Math.max(...hs.map(f));
    const row=(lab,fn,bestFn)=>`<tr><td>${lab}</td>${hs.map(h=>`<td class="${bestFn&&bestFn(h)?"best":""}">${fn(h)}</td>`).join("")}</tr>`;
    cmpT.innerHTML=`<div class="cmp-wrap"><table class="cmp">
    <thead><tr><th>Spec</th>${hs.map(h=>`<th><a href="${BASE}helmets/${h.slug}.html"><img src="${BASE}img/${h.slug}-1.svg" alt="" width="120" height="66" style="height:66px;object-fit:contain"><br>${h.brand} ${h.name}</a></th>`).join("")}</tr></thead><tbody>
    ${row("Price",h=>rup(h.price),h=>h.price===min(x=>x.price))}
    ${row("MRP",h=>rup(h.mrp))}
    ${row("Rating",h=>h.rating+" ★ ("+h.reviews.toLocaleString("en-IN")+")",h=>h.rating===max(x=>x.rating))}
    ${row("Weight",h=>h.weight+" g",h=>h.weight===min(x=>x.weight))}
    ${row("Certification",h=>h.certs.join(", "))}
    ${row("Shell material",h=>h.shell)}
    ${row("Visor",h=>h.visor)}
    ${row("Ventilation",h=>h.scores.ventilation+"/10",h=>h.scores.ventilation===max(x=>x.scores.ventilation))}
    ${row("Noise control",h=>h.scores.noise+"/10",h=>h.scores.noise===max(x=>x.scores.noise))}
    ${row("Comfort",h=>h.scores.comfort+"/10",h=>h.scores.comfort===max(x=>x.scores.comfort))}
    ${row("City score",h=>h.scores.city+"/10",h=>h.scores.city===max(x=>x.scores.city))}
    ${row("Highway score",h=>h.scores.highway+"/10",h=>h.scores.highway===max(x=>x.scores.highway))}
    ${row("Pinlock ready",h=>h.pinlock?"Yes":"No")}
    ${row("Bluetooth ready",h=>h.bluetooth?"Yes":"No")}
    ${row("Closure",h=>h.closure)}
    ${row("Sizes",h=>h.sizes.join(", "))}
    ${row("Warranty",()=>"1 year (manufacturer)")}
    ${row("Pros",h=>"<ul style='padding-left:16px'>"+h.pros.map(p=>"<li>"+p+"</li>").join("")+"</ul>")}
    ${row("Cons",h=>"<ul style='padding-left:16px'>"+h.cons.map(p=>"<li>"+p+"</li>").join("")+"</ul>")}
    ${row("",h=>`<a class="btn btn-amz btn-sm" rel="nofollow sponsored noopener" target="_blank" href="https://www.amazon.in/dp/${h.asin}?tag=YOURAFFILIATETAG-21">Buy on Amazon</a>`)}
    </tbody></table></div>`;
  }
  render();
})()}

/* gallery thumbs */
$$(".thumbs button").forEach(b=>b.addEventListener("click",()=>{
  $$(".thumbs button").forEach(x=>x.classList.remove("on"));b.classList.add("on");
  const m=$(".gallery .main img");m.style.opacity=0;setTimeout(()=>{m.src=b.dataset.src;m.style.opacity=1},180);
}));
})();
