import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = 'https://chgegfcnfzihmytgbhjh.supabase.co'
const SUPABASE_KEY = 'sb_publishable_sDXbz8NdgoVRcM8YRLNf1w_exWVBe96'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const dark = {
  bg:"#0d1117", card:"#161b22", card2:"#21262d", border:"#30363d",
  text:"#e6edf3", textS:"#8b949e", textM:"#6e7681", green:"#00e676",
  greenBg:"rgba(0,230,118,0.08)", greenBr:"rgba(0,230,118,0.3)",
  hdr:"#064e3b", red:"#f85149", gold:"#e3b341"
}
const light = {
  bg:"#f6f8fa", card:"#ffffff", card2:"#f0f2f4", border:"#d0d7de",
  text:"#1f2328", textS:"#656d76", textM:"#9198a1", green:"#1a7f37",
  greenBg:"rgba(26,127,55,0.08)", greenBr:"rgba(26,127,55,0.3)",
  hdr:"#064e3b", red:"#cf222e", gold:"#9a6700"
}
const HS = "'Hind Siliguri', sans-serif"

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
}

// ── Login Modal ────────────────────────────────────────
function LoginModal({ T, onClose }) {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:T.card,borderRadius:16,padding:28,width:"100%",maxWidth:340,border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>⚽</div>
          <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:4}}>খেলা কখন?</div>
          <div style={{fontSize:13,color:T.textS}}>প্রেডিকশন করতে লগইন করুন</div>
        </div>
        <button onClick={async()=>{setLoading(true);await signInWithGoogle()}} disabled={loading}
          style={{width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontFamily:HS,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading?"Loading...":"Google দিয়ে লগইন"}
        </button>
        <div style={{marginTop:16,fontSize:11,color:T.textM,textAlign:"center"}}>Schedule ও scores দেখতে login লাগবে না</div>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(true)
  const [lang, setLang] = useState("bn")
  const [mt, setMt] = useState("home")
  const [showLogin, setShowLogin] = useState(false)
  const T = dark ? {
    bg:"#0d1117", card:"#161b22", card2:"#21262d", border:"#30363d",
    text:"#e6edf3", textS:"#8b949e", textM:"#6e7681", green:"#00e676",
    greenBg:"rgba(0,230,118,0.08)", greenBr:"rgba(0,230,118,0.3)",
    hdr:"#064e3b", red:"#f85149", gold:"#e3b341"
  } : {
    bg:"#f6f8fa", card:"#ffffff", card2:"#f0f2f4", border:"#d0d7de",
    text:"#1f2328", textS:"#656d76", textM:"#9198a1", green:"#1a7f37",
    greenBg:"rgba(26,127,55,0.08)", greenBr:"rgba(26,127,55,0.3)",
    hdr:"#064e3b", red:"#cf222e", gold:"#9a6700"
  }

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user??null)
      setLoading(false)
    })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      setUser(session?.user??null)
      setLoading(false)
      if(event==="SIGNED_IN"&&window.location.hash)
        window.history.replaceState(null,"",window.location.pathname)
    })
    return()=>subscription.unsubscribe()
  },[])

  const tabs=[
    {id:"home",label:lang==="bn"?"হোম":"Home",icon:"🏠"},
    {id:"matches",label:lang==="bn"?"ম্যাচ":"Matches",icon:"⚽"},
    {id:"predict",label:lang==="bn"?"প্রেডিকশন":"Predict",icon:"⚡"},
    {id:"lb",label:lang==="bn"?"লিডারবোর্ড":"Leaderboard",icon:"📊"},
  ]

  if(loading) return(
    <div style={{minHeight:"100vh",background:"#0d1117",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:HS}}>
      <div style={{color:"#00e676",fontSize:16}}>লোড হচ্ছে...</div>
    </div>
  )

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{minHeight:"100vh",background:T.bg,fontFamily:HS,maxWidth:480,margin:"0 auto"}}>
        
        {/* Header */}
        <div style={{background:T.hdr,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>খেলা কখন?</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setLang(l=>l==="bn"?"en":"bn")} style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
              {lang==="bn"?"EN":"বাং"}
            </button>
            <button onClick={()=>setDark(d=>!d)} style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:13}}>
              {dark?"☀️":"🌙"}
            </button>
            {user ? (
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} style={{width:28,height:28,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)"}} alt=""/>
                  : <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>👤</div>
                }
              </div>
            ) : (
              <button onClick={()=>setShowLogin(true)} style={{background:"#00e676",border:"none",color:"#000",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {lang==="bn"?"লগইন":"Login"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",background:T.hdr,borderBottom:`1px solid rgba(255,255,255,0.1)`}}>
          {tabs.map(({id,label,icon})=>(
            <button key={id} onClick={()=>{
              if((id==="predict"||id==="lb")&&!user){setShowLogin(true);return;}
              setMt(id)
            }} style={{
              flex:1,background:"transparent",border:"none",
              borderBottom:`2.5px solid ${mt===id?"#fff":"transparent"}`,
              color:mt===id?"#fff":"rgba(255,255,255,0.5)",
              fontFamily:HS,fontSize:10,fontWeight:mt===id?700:400,
              padding:"8px 0 6px",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3
            }}>
              <span>{icon}</span>{label}
              {(id==="predict"||id==="lb")&&!user&&<span style={{fontSize:8,color:"#00e676"}}>🔒</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{paddingBottom:20}}>
          {mt==="home"&&(
            <div style={{padding:16}}>
              <div style={{background:T.card,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:12,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:8}}>🚧</div>
                <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>Coming Soon</div>
                <div style={{fontSize:13,color:T.textS,lineHeight:1.8}}>
                  Live scores · EPL predictions · Leaderboard
                </div>
              </div>
              {!user&&(
                <div style={{background:T.greenBg,border:`1px solid ${T.greenBr}`,borderRadius:12,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:13,color:T.green,marginBottom:10}}>
                    {lang==="bn"?"প্রেডিকশন করতে লগইন করুন":"Login to predict matches"}
                  </div>
                  <button onClick={()=>setShowLogin(true)} style={{background:T.green,border:"none",color:"#000",borderRadius:8,padding:"8px 20px",fontFamily:HS,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    {lang==="bn"?"Google দিয়ে লগইন":"Login with Google"}
                  </button>
                </div>
              )}
              {user&&(
                <div style={{background:T.card,borderRadius:12,padding:16,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                  {user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} style={{width:40,height:40,borderRadius:"50%"}} alt=""/>
                    : <div style={{width:40,height:40,borderRadius:"50%",background:T.greenBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👤</div>
                  }
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.text}}>{user.user_metadata?.full_name||user.email}</div>
                    <div style={{fontSize:11,color:T.green}}>✅ {lang==="bn"?"লগইন হয়েছে":"Logged in"}</div>
                  </div>
                  <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.textS,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>
                    {lang==="bn"?"বের হন":"Sign out"}
                  </button>
                </div>
              )}
            </div>
          )}
          {mt==="matches"&&(
            <div style={{padding:16,textAlign:"center",color:T.textS,fontSize:14,paddingTop:40}}>
              ⚽ Live scores coming soon...
            </div>
          )}
          {mt==="predict"&&user&&(
            <div style={{padding:16,textAlign:"center",color:T.textS,fontSize:14,paddingTop:40}}>
              ⚡ Predictions coming soon...
            </div>
          )}
          {mt==="lb"&&user&&(
            <div style={{padding:16,textAlign:"center",color:T.textS,fontSize:14,paddingTop:40}}>
              📊 Leaderboard coming soon...
            </div>
          )}
        </div>
      </div>

      {showLogin&&<LoginModal T={T} onClose={()=>setShowLogin(false)}/>}
    </>
  )
}
