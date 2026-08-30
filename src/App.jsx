import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = 'https://chgegfcnfzihmytgbhjh.supabase.co'
const SUPABASE_KEY = 'sb_publishable_sDXbz8NdgoVRcM8YRLNf1w_exWVBe96'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Theme ──────────────────────────────────────────────
const dark = {
  bg:"#0d1117", card:"#161b22", card2:"#21262d", border:"#30363d",
  text:"#e6edf3", textS:"#8b949e", textM:"#6e7681", green:"#00e676",
  greenBg:"rgba(0,230,118,0.08)", greenBr:"rgba(0,230,118,0.3)",
  hdr:"#0d1117", red:"#f85149", gold:"#e3b341"
}
const light = {
  bg:"#f6f8fa", card:"#ffffff", card2:"#f0f2f4", border:"#d0d7de",
  text:"#1f2328", textS:"#656d76", textM:"#9198a1", green:"#1a7f37",
  greenBg:"rgba(26,127,55,0.08)", greenBr:"rgba(26,127,55,0.3)",
  hdr:"#24292f", red:"#cf222e", gold:"#9a6700"
}

const HS = "'Hind Siliguri', sans-serif"

// ── Google Auth ────────────────────────────────────────
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) alert(error.message)
}

async function signOut() {
  await supabase.auth.signOut()
}

// ── Login Page ─────────────────────────────────────────
function LoginPage({ T, lang }) {
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    await signInWithGoogle()
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:HS}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:48,marginBottom:12}}>⚽</div>
        <div style={{fontSize:28,fontWeight:800,color:T.text,marginBottom:6}}>খেলা কখন?</div>
        <div style={{fontSize:14,color:T.textS}}>Football Prediction & Live Scores</div>
      </div>
      
      <div style={{background:T.card,borderRadius:16,padding:32,width:"100%",maxWidth:360,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:8,textAlign:"center"}}>
          {lang==="bn"?"লগইন করুন":"Sign in"}
        </div>
        <div style={{fontSize:13,color:T.textS,marginBottom:24,textAlign:"center"}}>
          {lang==="bn"?"প্রেডিকশন করতে Google দিয়ে লগইন করুন":"Sign in with Google to predict matches"}
        </div>

        <button onClick={handleGoogle} disabled={loading} style={{
          width:"100%",padding:"12px 16px",borderRadius:10,
          border:`1px solid ${T.border}`,background:T.card2,
          color:T.text,fontFamily:HS,fontSize:14,fontWeight:600,
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? "Loading..." : "Continue with Google"}
        </button>

        <div style={{marginTop:20,fontSize:12,color:T.textM,textAlign:"center"}}>
          By signing in, you agree to our terms of service
        </div>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────
function MainApp({ user, T, lang, setLang, setDarkMode, darkMode }) {
  const [mt, setMt] = useState("home")

  const tabs = [
    {id:"home", label:lang==="bn"?"হোম":"Home", icon:"🏠"},
    {id:"matches", label:lang==="bn"?"ম্যাচ":"Matches", icon:"⚽"},
    {id:"predict", label:lang==="bn"?"প্রেডিকশন":"Predict", icon:"⚡"},
    {id:"lb", label:lang==="bn"?"লিডারবোর্ড":"Leaderboard", icon:"📊"},
  ]

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:HS,maxWidth:480,margin:"0 auto"}}>
      {/* Header */}
      <div style={{background:"#1a7f37",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>খেলা কখন?</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setLang(l=>l==="bn"?"en":"bn")} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {lang==="bn"?"EN":"বাং"}
          </button>
          <button onClick={()=>setDarkMode(d=>!d)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:14}}>
            {darkMode?"☀️":"🌙"}
          </button>
          <div onClick={signOut} style={{cursor:"pointer"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>
          </div>
        </div>
      </div>

      {/* User info bar */}
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:T.greenBg,border:`2px solid ${T.green}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
          {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} style={{width:32,height:32,borderRadius:"50%"}} alt=""/> : "👤"}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text}}>{user.user_metadata?.full_name || user.email}</div>
          <div style={{fontSize:11,color:T.textS}}>{user.email}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{padding:16,paddingBottom:80}}>
        {mt==="home"&&(
          <div>
            <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:16}}>
              {lang==="bn"?"স্বাগতম! 🎉":"Welcome! 🎉"}
            </div>
            <div style={{background:T.card,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
              <div style={{fontSize:14,color:T.textS,marginBottom:8}}>{lang==="bn"?"Google দিয়ে সফলভাবে লগইন হয়েছে":"Successfully signed in with Google"}</div>
              <div style={{fontSize:13,color:T.green,fontWeight:600}}>✅ {lang==="bn"?"অ্যাকাউন্ট সক্রিয়":"Account active"}</div>
            </div>
            <div style={{background:T.card,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:12}}>🚧 Coming Soon</div>
              <div style={{fontSize:13,color:T.textS,lineHeight:1.8}}>
                • Live match scores<br/>
                • EPL predictions<br/>
                • Leaderboard<br/>
                • Paid tournament access
              </div>
            </div>
          </div>
        )}
        {mt==="matches"&&(
          <div style={{textAlign:"center",padding:40,color:T.textS,fontSize:14}}>
            Live scores coming soon...
          </div>
        )}
        {mt==="predict"&&(
          <div style={{textAlign:"center",padding:40,color:T.textS,fontSize:14}}>
            Predictions coming soon...
          </div>
        )}
        {mt==="lb"&&(
          <div style={{textAlign:"center",padding:40,color:T.textS,fontSize:14}}>
            Leaderboard coming soon...
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.card,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:50}}>
        {tabs.map(({id,label,icon})=>(
          <button key={id} onClick={()=>setMt(id)} style={{
            flex:1,background:"transparent",border:"none",
            borderTop:`2px solid ${mt===id?T.green:"transparent"}`,
            color:mt===id?T.green:T.textS,fontFamily:HS,fontSize:10,fontWeight:mt===id?700:400,
            padding:"10px 0 8px",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",gap:3
          }}>
            <span style={{fontSize:16}}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [lang, setLang] = useState("bn")
  const T = darkMode ? dark : light

  useEffect(()=>{
    // Check current session
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return ()=>subscription.unsubscribe()
  },[])

  if(loading) return(
    <div style={{minHeight:"100vh",background:dark.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#00e676",fontFamily:HS,fontSize:16}}>লোড হচ্ছে...</div>
    </div>
  )

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {user
        ? <MainApp user={user} T={T} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode}/>
        : <LoginPage T={T} lang={lang}/>
      }
    </>
  )
}
