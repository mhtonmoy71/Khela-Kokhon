import { useState, useEffect } from "react"

const API_KEY = "b3a4370cd7434e769f385e0f48aaf843"
const BASE = "https://api.football-data.org/v4"

// Bangladesh is UTC+6
const toBDT = (utcDate) => {
  const d = new Date(utcDate)
  return new Intl.DateTimeFormat("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric", month: "long", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  }).format(d)
}

const toBDTShort = (utcDate) => {
  const d = new Date(utcDate)
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true
  }).format(d)
}

const getCountdown = (utcDate) => {
  const diff = new Date(utcDate) - new Date()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d} দিন ${h} ঘণ্টা বাকি`
  if (h > 0) return `${h} ঘণ্টা ${m} মিনিট বাকি`
  return `${m} মিনিট বাকি`
}

// Popular teams with their IDs from football-data.org
const POPULAR_TEAMS = [
  { id: 57, name: "Arsenal", shortName: "Arsenal", crest: "https://crests.football-data.org/57.png", league: "PL" },
  { id: 61, name: "Chelsea", shortName: "Chelsea", crest: "https://crests.football-data.org/61.png", league: "PL" },
  { id: 64, name: "Liverpool", shortName: "Liverpool", crest: "https://crests.football-data.org/64.png", league: "PL" },
  { id: 65, name: "Man City", shortName: "Man City", crest: "https://crests.football-data.org/65.png", league: "PL" },
  { id: 66, name: "Man United", shortName: "Man Utd", crest: "https://crests.football-data.org/66.png", league: "PL" },
  { id: 73, name: "Tottenham", shortName: "Spurs", crest: "https://crests.football-data.org/73.png", league: "PL" },
  { id: 397, name: "Real Madrid", shortName: "Real", crest: "https://crests.football-data.org/86.png", league: "PD" },
  { id: 81, name: "Barcelona", shortName: "Barça", crest: "https://crests.football-data.org/81.png", league: "PD" },
  { id: 5, name: "Bayern", shortName: "Bayern", crest: "https://crests.football-data.org/5.png", league: "BL1" },
  { id: 721, name: "PSG", shortName: "PSG", crest: "https://crests.football-data.org/524.png", league: "FL1" },
  { id: 98, name: "AC Milan", shortName: "Milan", crest: "https://crests.football-data.org/98.png", league: "SA" },
  { id: 109, name: "Juventus", shortName: "Juve", crest: "https://crests.football-data.org/109.png", league: "SA" },
]

const T = {
  bg:"#0d1117", card:"#161b22", card2:"#21262d", border:"#30363d",
  text:"#e6edf3", textS:"#8b949e", textM:"#6e7681", green:"#00e676",
  greenBg:"rgba(0,230,118,0.08)", greenBr:"rgba(0,230,118,0.3)",
  hdr:"#064e3b", red:"#f85149", gold:"#e3b341"
}
const HS = "'Hind Siliguri', sans-serif"

function TeamCard({ team, onClick }) {
  return (
    <div onClick={() => onClick(team)} style={{
      background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
      padding:12, cursor:"pointer", textAlign:"center",
      transition:"border-color 0.2s",
      display:"flex", flexDirection:"column", alignItems:"center", gap:8
    }}>
      <img src={team.crest} alt={team.shortName}
        style={{width:44, height:44, objectFit:"contain"}}
        onError={e=>e.target.style.display="none"}/>
      <div style={{fontFamily:HS, fontSize:11, fontWeight:600, color:T.text}}>{team.shortName}</div>
    </div>
  )
}

function MatchCard({ match }) {
  const countdown = getCountdown(match.utcDate)
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED"
  const isFT = match.status === "FINISHED"

  return (
    <div style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:10}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
        <div style={{fontFamily:HS, fontSize:11, color:T.textM}}>{match.competition?.name}</div>
        {isLive && <div style={{background:"#f85149", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20}}>LIVE</div>}
        {isFT && <div style={{fontFamily:HS, fontSize:11, color:T.textS}}>FT</div>}
      </div>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <div style={{flex:1, display:"flex", alignItems:"center", gap:8}}>
          <img src={match.homeTeam.crest} style={{width:28, height:28, objectFit:"contain"}} alt=""
            onError={e=>e.target.style.display="none"}/>
          <div style={{fontFamily:HS, fontSize:14, fontWeight:600, color:T.text}}>{match.homeTeam.shortName||match.homeTeam.name}</div>
        </div>
        <div style={{textAlign:"center", minWidth:60}}>
          {isFT || isLive
            ? <div style={{fontFamily:HS, fontSize:18, fontWeight:800, color:T.text}}>
                {match.score?.fullTime?.home ?? 0} - {match.score?.fullTime?.away ?? 0}
              </div>
            : <div style={{fontFamily:HS, fontSize:12, color:T.green, fontWeight:600}}>vs</div>
          }
        </div>
        <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:8}}>
          <div style={{fontFamily:HS, fontSize:14, fontWeight:600, color:T.text, textAlign:"right"}}>{match.awayTeam.shortName||match.awayTeam.name}</div>
          <img src={match.awayTeam.crest} style={{width:28, height:28, objectFit:"contain"}} alt=""
            onError={e=>e.target.style.display="none"}/>
        </div>
      </div>
      {!isFT && (
        <div style={{marginTop:12, textAlign:"center"}}>
          <div style={{fontFamily:HS, fontSize:12, color:T.textS}}>{toBDTShort(match.utcDate)}</div>
          {countdown && <div style={{fontFamily:HS, fontSize:11, color:T.green, marginTop:4}}>⏱️ {countdown}</div>}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [todayMatches, setTodayMatches] = useState([])
  const [todayLoading, setTodayLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Fetch today's matches
  useEffect(()=>{
    const today = new Date().toISOString().split("T")[0]
    fetch(`${BASE}/matches?date=${today}`, {
      headers: { "X-Auth-Token": API_KEY }
    })
    .then(r=>r.json())
    .then(data=>{
      setTodayMatches(data.matches||[])
      setTodayLoading(false)
    })
    .catch(()=>setTodayLoading(false))
  },[])

  // Fetch team's next match
  const fetchTeamMatches = async (team) => {
    setSelectedTeam(team)
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/teams/${team.id}/matches?status=SCHEDULED&limit=5`, {
        headers: { "X-Auth-Token": API_KEY }
      })
      const data = await r.json()
      setMatches(data.matches||[])
    } catch(e) {
      setMatches([])
    }
    setLoading(false)
  }

  const filtered = search
    ? POPULAR_TEAMS.filter(t=>t.name.toLowerCase().includes(search.toLowerCase())||t.shortName.toLowerCase().includes(search.toLowerCase()))
    : POPULAR_TEAMS

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{minHeight:"100vh", background:T.bg, fontFamily:HS, maxWidth:480, margin:"0 auto"}}>
        
        {/* Header */}
        <div style={{background:T.hdr, padding:"14px 16px", position:"sticky", top:0, zIndex:50, boxShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>
          <div style={{fontSize:20, fontWeight:800, color:"#fff"}}>খেলা কখন? ⚽</div>
          <div style={{fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:2}}>Football schedules in Bangladesh time</div>
        </div>

        <div style={{padding:16}}>

          {/* Search */}
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 দল খুঁজুন..."
            style={{width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${T.border}`,
              background:T.card2, color:T.text, fontFamily:HS, fontSize:13,
              boxSizing:"border-box", marginBottom:16, outline:"none"}}
          />

          {/* Team grid */}
          {!selectedTeam && (
            <>
              <div style={{fontFamily:HS, fontSize:13, fontWeight:700, color:T.textS, marginBottom:12}}>জনপ্রিয় দল</div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:24}}>
                {filtered.map(team=>(
                  <TeamCard key={team.id} team={team} onClick={fetchTeamMatches}/>
                ))}
              </div>
            </>
          )}

          {/* Selected team matches */}
          {selectedTeam && (
            <div>
              <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
                <button onClick={()=>{setSelectedTeam(null);setMatches([])}}
                  style={{background:T.card2, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"6px 12px", fontFamily:HS, fontSize:12, cursor:"pointer"}}>
                  ← ফিরে যান
                </button>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <img src={selectedTeam.crest} style={{width:32, height:32, objectFit:"contain"}} alt=""/>
                  <div style={{fontFamily:HS, fontSize:16, fontWeight:800, color:T.text}}>{selectedTeam.name}</div>
                </div>
              </div>
              {loading ? (
                <div style={{textAlign:"center", padding:40, color:T.textS}}>লোড হচ্ছে...</div>
              ) : matches.length > 0 ? (
                matches.map(m=><MatchCard key={m.id} match={m}/>)
              ) : (
                <div style={{textAlign:"center", padding:40, color:T.textS}}>কোনো upcoming match নেই</div>
              )}
            </div>
          )}

          {/* Today's matches */}
          {!selectedTeam && (
            <>
              <div style={{fontFamily:HS, fontSize:13, fontWeight:700, color:T.textS, marginBottom:12}}>আজকের ম্যাচ</div>
              {todayLoading ? (
                <div style={{textAlign:"center", padding:20, color:T.textS}}>লোড হচ্ছে...</div>
              ) : todayMatches.length > 0 ? (
                todayMatches.map(m=><MatchCard key={m.id} match={m}/>)
              ) : (
                <div style={{textAlign:"center", padding:20, color:T.textS, background:T.card, borderRadius:12, border:`1px solid ${T.border}`}}>
                  আজ কোনো ম্যাচ নেই
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
