import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Check, Flag, RotateCcw, Plus, Trash2, Info, TrendingUp, Mountain } from "lucide-react";

/* ================================================================
   CONSTANTES
   ================================================================ */
const RACE_DATE = new Date("2027-04-18T08:00:00+02:00");
const START_DATE = "2026-09-08";
const STORAGE_KEY = "annecy-marathon-plan-v1";

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

const CATS = {
  easy:    { label: "Footing",       color: "#5B7F52", bg: "#EEF3EA", border: "#CBDBC2" },
  quality: { label: "Qualité",       color: "#B8791E", bg: "#FBF1DC", border: "#ECCE94" },
  long:    { label: "Sortie longue", color: "#2F6690", bg: "#E8F1F6", border: "#B9D4E5" },
  test:    { label: "Course test",   color: "#8B4B6B", bg: "#F4E9EF", border: "#DDB9CC" },
  race:    { label: "Marathon",      color: "#A8790A", bg: "#FBF3D9", border: "#E9CE86" },
};

const PHASE_LABELS = {
  BASE1: "Base aérobie", BASE2: "Base aérobie", BUILD1: "Développement",
  TEST: "Test de forme", RECUP: "Récupération", BUILD2: "Spécifique marathon",
  PEAK: "Pic de charge", TAPER: "Affûtage", RACE: "Semaine de course",
};

// Table hebdomadaire : la logique d'entraînement (32 semaines, du 07/09/2026 au 18/04/2027)
const WEEK_PLAN = [
  { phase:"BASE1",  freq:3, long:10,    longType:"easy", quality:{title:"Footing + 4 lignes droites", km:7} , mon:0, fri:5 },
  { phase:"BASE1",  freq:3, long:11,    longType:"easy", quality:{title:"Footing progressif (finir plus vite)", km:8}, mon:0, fri:6 },
  { phase:"BASE1",  freq:3, long:12,    longType:"easy", quality:{title:"Footing + 6 lignes droites", km:8}, mon:0, fri:6 },
  { phase:"BASE1",  freq:3, long:9,     longType:"easy", quality:{title:"Footing facile (semaine allégée)", km:6}, mon:0, fri:5 },
  { phase:"BASE1",  freq:3, long:13,    longType:"easy", quality:{title:"Tempo 15 min modéré", km:8}, mon:0, fri:6 },
  { phase:"BASE1",  freq:4, long:14,    longType:"easy", quality:{title:"Tempo 20 min", km:9}, mon:5, fri:7 },
  { phase:"BASE2",  freq:4, long:15,    longType:"easy", quality:{title:"Seuil 2x10 min (récup 2 min)", km:9}, mon:5, fri:7 },
  { phase:"BASE2",  freq:3, long:12,    longType:"easy", quality:{title:"Footing + lignes droites (allégée)", km:7}, mon:0, fri:6 },
  { phase:"BASE2",  freq:4, long:16,    longType:"easy", quality:{title:"Seuil 3x8 min (récup 90s)", km:10}, mon:6, fri:8 },
  { phase:"BASE2",  freq:4, long:17,    longType:"easy", quality:{title:"Fractionné 8x400m (récup 90s)", km:9}, mon:6, fri:8 },
  { phase:"BUILD1", freq:4, long:18,    longType:"easy", quality:{title:"Seuil 25 min continu", km:10}, mon:6, fri:8 },
  { phase:"BUILD1", freq:3, long:14,    longType:"easy", quality:{title:"Footing facile (allégée)", km:7}, mon:0, fri:6 },
  { phase:"BUILD1", freq:4, long:18,    longType:"easy", quality:{title:"Fractionné 6x800m (récup 2 min)", km:10}, mon:6, fri:8 },
  { phase:"BUILD1", freq:4, long:19,    longType:"easy", quality:{title:"Seuil 2x15 min (récup 3 min)", km:10}, mon:7, fri:9 },
  { phase:"BUILD1", freq:4, long:20,    longType:"easy", quality:{title:"Fractionné 5x1000m (récup 2 min)", km:10}, mon:7, fri:9 },
  { phase:"BUILD1", freq:2, long:12,    longType:"easy", longTitle:"Footing de Noël (léger)", quality:{title:"Footing très facile", km:6}, mon:0, fri:0 },
  { phase:"BUILD1", freq:3, long:17,    longType:"easy", quality:{title:"Footing progressif (reprise)", km:8}, mon:0, fri:6 },
  { phase:"BUILD1", freq:4, long:20,    longType:"easy", quality:{title:"Seuil 30 min continu", km:10}, mon:7, fri:9 },
  { phase:"BUILD1", freq:3, long:15,    longType:"easy", quality:{title:"Footing + lignes droites", km:7}, mon:0, fri:7 },
  { phase:"TEST",   freq:3, long:21.1,  longType:"test", longTitle:"Semi-marathon test (en course)", quality:{title:"Footing très facile (avant test)", km:6}, mon:0, fri:5 },
  { phase:"RECUP",  freq:2, long:12,    longType:"easy", longTitle:"Footing facile (récupération)", quality:{title:"Footing très facile", km:6}, mon:0, fri:0 },
  { phase:"BUILD2", freq:4, long:20,    longType:"mp",   longTitle:"Sortie longue 20km dont 8km allure marathon", quality:{title:"3x3km allure marathon (récup 3 min)", km:12}, mon:7, fri:9 },
  { phase:"BUILD2", freq:4, long:22,    longType:"easy", quality:{title:"Seuil 3x12 min (récup 3 min)", km:11}, mon:8, fri:10 },
  { phase:"BUILD2", freq:4, long:24,    longType:"easy", quality:{title:"Fractionné 5x1000m rapide (récup 2 min)", km:11}, mon:8, fri:10 },
  { phase:"BUILD2", freq:3, long:17,    longType:"easy", quality:{title:"Footing facile (allégée)", km:8}, mon:0, fri:8 },
  { phase:"BUILD2", freq:4, long:26,    longType:"mp",   longTitle:"Sortie longue 26km dont 14km allure marathon", quality:{title:"4x2km allure marathon (récup 2 min)", km:13}, mon:8, fri:10 },
  { phase:"PEAK",   freq:4, long:29,    longType:"mp",   longTitle:"Sortie longue 29km dont 16km allure marathon", quality:{title:"Seuil 3x15 min (récup 3 min)", km:12}, mon:8, fri:10 },
  { phase:"PEAK",   freq:4, long:32,    longType:"mp",   longTitle:"Sortie longue de référence — 32km dont 18km allure marathon", quality:{title:"Fractionné 6x1000m (récup 2 min)", km:11}, mon:8, fri:10 },
  { phase:"TAPER",  freq:4, long:22,    longType:"mp",   longTitle:"Sortie longue 22km dont 10km allure marathon", quality:{title:"4x1000m allure marathon (récup 2 min)", km:9}, mon:7, fri:9 },
  { phase:"TAPER",  freq:3, long:16,    longType:"easy", quality:{title:"3x1km allure semi (rappel de rythme)", km:7}, mon:0, fri:7 },
  { phase:"TAPER",  freq:3, long:11,    longType:"easy", quality:{title:"5x200m rapide (affûtage)", km:5}, mon:0, fri:6 },
  { phase:"RACE",   freq:0, long:42.195,longType:"race", longTitle:"MARATHON D'ANNECY", quality:{title:"Footing très facile + 4 lignes droites", km:5}, mon:0, fri:0 },
];

/* ================================================================
   FONCTIONS UTILITAIRES
   ================================================================ */
function pad(n){ return String(n).padStart(2,"0"); }
function fmtDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseISO(s){ const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
function addDays(d,n){ const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function todayStr(){ return fmtDate(new Date()); }
function isoWeekBounds(d){
  const mon = addDays(d, -((d.getDay()+6)%7));
  const sun = addDays(mon,6);
  return { mon: fmtDate(mon), sun: fmtDate(sun) };
}

function mkSession(idx,date,cat,title,km,week,phase){
  return { id:`s${idx}`, date, cat, title, km, week, phase, completed:false, actualKm:null, actualMin:null, notes:"" };
}

function generateDefaultSessions(){
  const firstMonday = new Date(2026,8,7); // lundi 7 septembre 2026
  const sessions = [];
  let c = 0;
  WEEK_PLAN.forEach((w,i)=>{
    const monday = addDays(firstMonday, 7*i);
    const at = (off)=>fmtDate(addDays(monday,off));
    const week = i+1;

    if (w.phase === "RACE") {
      const tue = at(1);
      if (tue >= START_DATE) sessions.push(mkSession(c++, tue, "easy", w.quality.title, w.quality.km, week, w.phase));
      sessions.push(mkSession(c++, at(6), "race", w.longTitle, w.long, week, w.phase));
      return;
    }
    if (w.freq === 4 && w.mon > 0) {
      sessions.push(mkSession(c++, at(0), "easy", "Footing facile", w.mon, week, w.phase));
    }
    const tue = at(1);
    if (tue >= START_DATE) {
      const cat = w.longType === "test" ? "easy" : "quality";
      sessions.push(mkSession(c++, tue, cat, w.quality.title, w.quality.km, week, w.phase));
    }
    if (w.freq >= 3 && w.fri > 0) {
      sessions.push(mkSession(c++, at(4), "easy", "Footing facile", w.fri, week, w.phase));
    }
    const cat = w.longType === "test" ? "test" : "long";
    sessions.push(mkSession(c++, at(6), cat, w.longTitle || "Sortie longue", w.long, week, w.phase));
  });
  return sessions;
}

function useCountdown(target){
  const [now, setNow] = useState(()=>Date.now());
  useEffect(()=>{
    const id = setInterval(()=>setNow(Date.now()), 1000);
    return ()=>clearInterval(id);
  },[]);
  const diff = target.getTime() - now;
  const past = diff <= 0;
  const abs = Math.max(diff,0);
  return {
    days: Math.floor(abs/86400000),
    hours: Math.floor((abs%86400000)/3600000),
    minutes: Math.floor((abs%3600000)/60000),
    seconds: Math.floor((abs%60000)/1000),
    past,
  };
}

function getMonthMatrix(year, month){
  const first = new Date(year, month, 1);
  const offset = (first.getDay()+6)%7;
  const start = addDays(first, -offset);
  const weeks = [];
  let cur = start;
  for (let w=0; w<6; w++){
    const row = [];
    for (let d=0; d<7; d++){ row.push(cur); cur = addDays(cur,1); }
    weeks.push(row);
  }
  return weeks;
}

/* ================================================================
   PETITS COMPOSANTS
   ================================================================ */
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center px-2.5 sm:px-5">
      <div className="tabular-nums font-bold text-3xl sm:text-5xl leading-none" style={{fontFamily:"'Oswald', sans-serif", color:"#F2C868"}}>
        {pad(value)}
      </div>
      <div className="text-[10px] sm:text-xs mt-2 uppercase" style={{color:"#9FC1CC", letterSpacing:"0.12em"}}>{label}</div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="flex-1 min-w-[130px] px-4 py-3 sm:py-4">
      <div className="text-[11px] uppercase tracking-wide" style={{color:"#7C8B8F", letterSpacing:"0.08em"}}>{label}</div>
      <div className="text-xl sm:text-2xl font-bold mt-0.5" style={{fontFamily:"'Oswald', sans-serif", color:"#1A2B32"}}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{color:"#8A9A9E"}}>{sub}</div>}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
      {Object.entries(CATS).map(([key,c])=>(
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor:c.color}} />
          <span className="text-xs" style={{color:"#5C6B6F"}}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function SessionPill({ session, onClick, onDragStart }) {
  const c = CATS[session.cat] || CATS.easy;
  const isPast = session.date < todayStr();
  const missed = isPast && !session.completed && session.cat !== "race";
  return (
    <button
      draggable
      onDragStart={(e)=>{ e.dataTransfer.setData("text/plain", session.id); onDragStart && onDragStart(session.id); }}
      onClick={(e)=>{ e.stopPropagation(); onClick(session); }}
      className="w-full text-left rounded-md px-1.5 py-1 mb-1 border text-[11px] sm:text-xs leading-tight transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        color: c.color,
        opacity: missed ? 0.55 : 1,
      }}
      title={`${session.title} — ${session.km}${session.cat==='race' ? '' : ' km'}`}
    >
      <div className="flex items-center gap-1">
        {session.completed && <Check size={11} strokeWidth={3} />}
        <span className="truncate font-medium">{session.cat === 'race' ? '🏁 ' : ''}{session.title}</span>
      </div>
      <div className="opacity-80">{session.km}{session.cat==='race' ? ' km' : ' km'}</div>
    </button>
  );
}

function DayCell({ date, inMonth, isToday, sessions, onDayClick, onSessionClick, onDrop }) {
  const [over, setOver] = useState(false);
  const dateStr = fmtDate(date);
  return (
    <div
      onClick={()=>onDayClick(dateStr)}
      onDragOver={(e)=>{ e.preventDefault(); setOver(true); }}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{ e.preventDefault(); setOver(false); const id = e.dataTransfer.getData("text/plain"); onDrop(id, dateStr); }}
      className="min-h-[86px] sm:min-h-[110px] border-r border-b p-1 sm:p-1.5 cursor-pointer transition-colors"
      style={{
        borderColor:"#E3E8E7",
        backgroundColor: over ? "#EAF3F0" : (inMonth ? "#FFFFFF" : "#FAFBFA"),
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs sm:text-sm inline-flex items-center justify-center"
          style={{
            color: inMonth ? "#33454B" : "#B7C1C0",
            fontWeight: isToday ? 700 : 400,
            width: isToday ? 20 : "auto",
            height: isToday ? 20 : "auto",
            borderRadius: isToday ? 999 : 0,
            backgroundColor: isToday ? "#1F6F8B" : "transparent",
            color2: undefined,
          }}
        >
          <span style={{color: isToday ? "#FFFFFF" : (inMonth ? "#33454B" : "#B7C1C0")}}>{date.getDate()}</span>
        </span>
      </div>
      <div>
        {sessions.map(s=>(
          <SessionPill key={s.id} session={s} onClick={onSessionClick} />
        ))}
      </div>
    </div>
  );
}

function SessionModal({ mode, initial, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(initial.title || "");
  const [cat, setCat] = useState(initial.cat || "easy");
  const [date, setDate] = useState(initial.date || todayStr());
  const [km, setKm] = useState(String(initial.km ?? 5));
  const [notes, setNotes] = useState(initial.notes || "");
  const [completed, setCompleted] = useState(initial.completed || false);
  const [actualKm, setActualKm] = useState(initial.actualKm != null ? String(initial.actualKm) : String(initial.km ?? ""));
  const [actualMin, setActualMin] = useState(initial.actualMin != null ? String(initial.actualMin) : "");

  function handleSave(){
    if (!title.trim()) return;
    onSave({
      ...initial,
      title: title.trim(),
      cat, date,
      km: parseFloat(km.replace(",",".")) || 0,
      notes,
      completed,
      actualKm: completed ? (parseFloat(actualKm.replace(",",".")) || 0) : null,
      actualMin: completed && actualMin !== "" ? (parseFloat(actualMin.replace(",",".")) || null) : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{backgroundColor:"rgba(20,30,34,0.45)"}} onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e)=>e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{fontFamily:"'Oswald', sans-serif", color:"#1A2B32"}}>
            {mode === "new" ? "Ajouter une séance" : "Modifier la séance"}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} color="#5C6B6F" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Titre</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" style={{borderColor:"#D7DEDD"}} placeholder="Ex. Fractionné 6x800m" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" style={{borderColor:"#D7DEDD"}} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Distance (km)</label>
              <input value={km} onChange={e=>setKm(e.target.value)} inputMode="decimal" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" style={{borderColor:"#D7DEDD"}} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Type de séance</label>
            <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white" style={{borderColor:"#D7DEDD"}}>
              {Object.entries(CATS).map(([key,c])=>(<option key={key} value={key}>{c.label}</option>))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" style={{borderColor:"#D7DEDD"}} placeholder="Sensations, météo, allure réelle…" />
          </div>

          <div className="pt-1 border-t" style={{borderColor:"#EEF1F0"}}>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input type="checkbox" checked={completed} onChange={e=>{
                setCompleted(e.target.checked);
                if (e.target.checked && !actualKm) setActualKm(km);
              }} className="w-4 h-4" />
              <span className="text-sm font-medium" style={{color:"#1A2B32"}}>Séance réalisée</span>
            </label>

            {completed && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Distance réelle (km)</label>
                  <input value={actualKm} onChange={e=>setActualKm(e.target.value)} inputMode="decimal" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" style={{borderColor:"#D7DEDD"}} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{color:"#5C6B6F"}}>Durée (min, optionnel)</label>
                  <input value={actualMin} onChange={e=>setActualMin(e.target.value)} inputMode="decimal" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" style={{borderColor:"#D7DEDD"}} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          {mode === "edit" ? (
            <button onClick={()=>onDelete(initial.id)} className="text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50" style={{color:"#B5453D"}}>
              <Trash2 size={15} /> Supprimer
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg" style={{color:"#5C6B6F", backgroundColor:"#F0F2F1"}}>Annuler</button>
            <button onClick={handleSave} className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{backgroundColor:"#1F6F8B"}}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ sessions, currentWeek }) {
  const totals = useMemo(()=>{
    const map = {};
    sessions.forEach(s=>{ map[s.week] = (map[s.week]||0) + s.km; });
    return Array.from({length:32}, (_,i)=>({ week:i+1, km: map[i+1]||0 }));
  },[sessions]);
  const max = Math.max(...totals.map(t=>t.km), 1);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-end gap-[3px] h-24 sm:h-28" style={{minWidth: 32*14}}>
        {totals.map(t=>{
          const isCurrent = t.week === currentWeek;
          return (
            <div key={t.week} className="flex flex-col items-center justify-end h-full" style={{width:11}} title={`Semaine ${t.week} — ${t.km.toFixed(1)} km`}>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max((t.km/max)*100, 3)}%`,
                  backgroundColor: isCurrent ? "#D9A441" : "#B9D4E5",
                  boxShadow: isCurrent ? "0 0 0 1.5px #A8790A" : "none",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[10px]" style={{color:"#8A9A9E"}}>
        <span>Sept. 2026</span>
        <span>Avril 2027</span>
      </div>
    </div>
  );
}

/* ================================================================
   APP PRINCIPALE
   ================================================================ */
export default function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [modal, setModal] = useState(null); // {mode:'new'|'edit', data}
  const [confirmReset, setConfirmReset] = useState(false);
  const hasLoaded = useRef(false);

  const countdown = useCountdown(RACE_DATE);

  // Chargement initial depuis le stockage persistant
  useEffect(()=>{
    (async ()=>{
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setSessions(parsed.sessions || generateDefaultSessions());
        } else {
          const def = generateDefaultSessions();
          setSessions(def);
          await window.storage.set(STORAGE_KEY, JSON.stringify({sessions: def}), false).catch(()=>{});
        }
      } catch (err) {
        const def = generateDefaultSessions();
        setSessions(def);
        try { await window.storage.set(STORAGE_KEY, JSON.stringify({sessions: def}), false); } catch(e){}
      } finally {
        setLoading(false);
        hasLoaded.current = true;
      }
    })();
  },[]);

  // Sauvegarde à chaque changement (après le chargement initial)
  useEffect(()=>{
    if (!hasLoaded.current) return;
    window.storage.set(STORAGE_KEY, JSON.stringify({sessions}), false).catch(()=>{});
  },[sessions]);

  function saveSession(updated){
    setSessions(prev=>{
      const exists = prev.some(s=>s.id===updated.id);
      if (exists) return prev.map(s=> s.id===updated.id ? updated : s);
      return [...prev, updated];
    });
    setModal(null);
  }
  function deleteSession(id){
    setSessions(prev=>prev.filter(s=>s.id!==id));
    setModal(null);
  }
  function moveSession(id, newDate){
    setSessions(prev=>prev.map(s=> s.id===id ? {...s, date:newDate} : s));
  }

  const today = todayStr();
  const { mon: weekMon, sun: weekSun } = isoWeekBounds(new Date());
  const thisWeekSessions = sessions.filter(s=>s.date>=weekMon && s.date<=weekSun);
  const currentWeekInfo = thisWeekSessions[0];

  const totalPlannedKm = sessions.reduce((a,s)=>a+s.km,0);
  const completedSessions = sessions.filter(s=>s.completed);
  const totalDoneKm = completedSessions.reduce((a,s)=>a+(s.actualKm ?? s.km),0);
  const remainingKm = Math.max(totalPlannedKm - totalDoneKm, 0);

  const nextSession = useMemo(()=>{
    return [...sessions].filter(s=>s.date>=today && !s.completed).sort((a,b)=>a.date.localeCompare(b.date))[0];
  },[sessions, today]);

  const monthMatrix = useMemo(()=>getMonthMatrix(viewYear, viewMonth),[viewYear,viewMonth]);
  const sessionsByDate = useMemo(()=>{
    const map = {};
    sessions.forEach(s=>{ (map[s.date] = map[s.date]||[]).push(s); });
    return map;
  },[sessions]);

  function changeMonth(delta){
    let m = viewMonth + delta, y = viewYear;
    if (m<0){ m=11; y--; } if (m>11){ m=0; y++; }
    setViewMonth(m); setViewYear(y);
  }

  function openNew(date){ setModal({ mode:"new", data:{ date, cat:"easy", title:"", km:5 } }); }
  function openEdit(session){ setModal({ mode:"edit", data: session }); }

  let statusMsg;
  if (today < START_DATE) statusMsg = "Le programme démarre demain";
  else if (countdown.past) statusMsg = "Objectif atteint — bravo !";
  else if (currentWeekInfo) statusMsg = `S${currentWeekInfo.week}/32 · ${PHASE_LABELS[currentWeekInfo.phase]}`;
  else statusMsg = "—";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{color:"#5C6B6F"}}>Chargement du plan…</div>;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor:"#F5F8F7", fontFamily:"'Inter', system-ui, sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>

      {/* HEADER */}
      <div className="relative overflow-hidden" style={{backgroundColor:"#123B4A"}}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 pb-16 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Mountain size={16} color="#9FC1CC" />
            <span className="text-xs uppercase" style={{color:"#9FC1CC", letterSpacing:"0.12em"}}>Marathon du Lac d'Annecy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-5" style={{fontFamily:"'Oswald', sans-serif", color:"#FFFFFF"}}>
            Objectif : passer sous les 4 heures
          </h1>
          <div className="flex justify-start -ml-2.5 sm:-ml-5">
            <CountdownUnit value={countdown.days} label="jours" />
            <CountdownUnit value={countdown.hours} label="heures" />
            <CountdownUnit value={countdown.minutes} label="minutes" />
            <CountdownUnit value={countdown.seconds} label="secondes" />
          </div>
          <div className="text-sm mt-4" style={{color:"#7FA6B3"}}>Dimanche 18 avril 2027 · 8h00 · Le Pâquier, Annecy</div>
        </div>
        {/* silhouette de montagnes */}
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-10 sm:h-14" style={{opacity:0.5}}>
          <polygon points="0,60 0,35 80,10 150,32 230,5 320,30 400,12 470,34 560,8 650,28 720,15 800,33 800,60" fill="#1F6F8B" />
        </svg>
      </div>

      {/* STATS STRIP */}
      <div className="max-w-4xl mx-auto px-2 sm:px-8">
        <div className="flex flex-wrap divide-x bg-white -mt-8 relative z-10 rounded-xl shadow-sm" style={{borderColor:"#E3E8E7", borderWidth:1}}>
          <StatCard label="Km réalisés" value={`${totalDoneKm.toFixed(0)} / ${totalPlannedKm.toFixed(0)}`} sub="kilomètres" />
          <StatCard label="Km restants" value={remainingKm.toFixed(0)} sub="avant le marathon" />
          <StatCard label="Séances" value={`${completedSessions.length} / ${sessions.length}`} sub="réalisées" />
          <StatCard label="Semaine" value={statusMsg} />
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="max-w-4xl mx-auto px-2 sm:px-8 mt-8">
        <div className="flex items-center justify-between mb-3 px-2 sm:px-0">
          <div className="flex items-center gap-3">
            <button onClick={()=>changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-white"><ChevronLeft size={18} color="#33454B"/></button>
            <h2 className="text-base sm:text-lg font-bold w-40 text-center" style={{fontFamily:"'Oswald', sans-serif", color:"#1A2B32"}}>
              {MONTHS_FR[viewMonth]} {viewYear}
            </h2>
            <button onClick={()=>changeMonth(1)} className="p-1.5 rounded-lg hover:bg-white"><ChevronRight size={18} color="#33454B"/></button>
          </div>
          <button onClick={()=>openNew(fmtDate(new Date(viewYear,viewMonth,Math.min(new Date().getDate(),28))))} className="flex items-center gap-1 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-white" style={{backgroundColor:"#1F6F8B"}}>
            <Plus size={15} /> Ajouter
          </button>
        </div>

        <div className="mb-3 px-2 sm:px-0">
          <Legend />
        </div>

        <div className="bg-white rounded-xl overflow-hidden border" style={{borderColor:"#E3E8E7"}}>
          <div className="grid grid-cols-7 border-b" style={{borderColor:"#E3E8E7"}}>
            {DAYS_FR.map(d=>(
              <div key={d} className="text-center text-[11px] sm:text-xs py-2 font-medium" style={{color:"#8A9A9E"}}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthMatrix.flat().map((date,i)=>(
              <DayCell
                key={i}
                date={date}
                inMonth={date.getMonth()===viewMonth}
                isToday={fmtDate(date)===today}
                sessions={sessionsByDate[fmtDate(date)] || []}
                onDayClick={(d)=>openNew(d)}
                onSessionClick={openEdit}
                onDrop={moveSession}
              />
            ))}
          </div>
        </div>
      </div>

      {/* VOLUME HEBDOMADAIRE */}
      <div className="max-w-4xl mx-auto px-2 sm:px-8 mt-8">
        <div className="bg-white rounded-xl border p-4 sm:p-5" style={{borderColor:"#E3E8E7"}}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} color="#5C6B6F" />
            <h3 className="text-sm font-semibold" style={{color:"#1A2B32"}}>Volume hebdomadaire sur les 32 semaines</h3>
          </div>
          <WeeklyChart sessions={sessions} currentWeek={currentWeekInfo?.week} />
        </div>
      </div>

      {/* REPERES ALLURES + FOOTER */}
      <div className="max-w-4xl mx-auto px-2 sm:px-8 mt-8 pb-16">
        <div className="bg-white rounded-xl border p-4 sm:p-5" style={{borderColor:"#E3E8E7"}}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} color="#5C6B6F" />
            <h3 className="text-sm font-semibold" style={{color:"#1A2B32"}}>Repères d'allure (à ajuster selon vos sensations)</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            {[
              ["Footing", "6:00 – 6:30 /km"],
              ["Seuil / tempo", "4:55 – 5:10 /km"],
              ["Fractionné", "4:35 – 4:50 /km"],
              ["Allure marathon", "5:30 – 5:40 /km"],
              ["Semi actuel", "≈ 5:13 /km"],
            ].map(([label,val])=>(
              <div key={label}>
                <div className="text-xs" style={{color:"#8A9A9E"}}>{label}</div>
                <div className="font-semibold" style={{color:"#1A2B32"}}>{val}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{color:"#8A9A9E"}}>
            Ces allures sont estimées à partir de votre semi en 1h50 et affinées via le test grandeur nature de la semaine 20 (24 janvier 2027).
          </p>
        </div>

        <div className="flex justify-center mt-6">
          {!confirmReset ? (
            <button onClick={()=>setConfirmReset(true)} className="flex items-center gap-1.5 text-xs" style={{color:"#8A9A9E"}}>
              <RotateCcw size={13} /> Réinitialiser le plan
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span style={{color:"#5C6B6F"}}>Effacer toute la progression ?</span>
              <button onClick={async()=>{ const def=generateDefaultSessions(); setSessions(def); setConfirmReset(false); }} className="px-2 py-1 rounded font-medium text-white" style={{backgroundColor:"#B5453D"}}>Confirmer</button>
              <button onClick={()=>setConfirmReset(false)} className="px-2 py-1 rounded" style={{backgroundColor:"#F0F2F1", color:"#5C6B6F"}}>Annuler</button>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <SessionModal
          mode={modal.mode}
          initial={modal.data}
          onSave={saveSession}
          onDelete={deleteSession}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}
