// İmzalama: her derlemede yeni sertifika oluşturmak yerine repodaki SABİT anahtarla tek bir
// "Apple Distribution" sertifikasını ve tek bir App Store profilini tekrar tekrar kullanır.
// Çıktı: $TMP/signing.env (PROFILE_NAME, PROFILE_UUID, WIDGET_PROFILE_NAME, WIDGET_PROFILE_UUID, P12, P12_PASS)
const fs=require('fs'),crypto=require('crypto'),os=require('os'),path=require('path'),{execSync}=require('child_process');
const TEAM='Z5ZU32M6W4',KID='G272Z79794',ISS='ab9b64ae-e251-4e02-b25f-e51f11fccc2d',BUNDLE='com.bolatemre.khz',PROFILE='KHZ AppStore CI',WIDGET_BUNDLE='com.bolatemre.khz.widget',WIDGET_PROFILE='KHZ Widget AppStore CI';
const TMP=process.env.RUNNER_TEMP||os.tmpdir();
const pass=process.env.KEY_PASS;if(!pass){console.error('KEY_PASS secret eksik');process.exit(1);}
function dec(file){const b=Buffer.from(fs.readFileSync(path.join(__dirname,'..','secrets',file),'utf8').trim(),'base64');
  const d=crypto.createDecipheriv('aes-256-gcm',crypto.scryptSync(pass,b.subarray(0,16),32),b.subarray(16,28));d.setAuthTag(b.subarray(28,44));
  return Buffer.concat([d.update(b.subarray(44)),d.final()]).toString();}
const p8=dec('asc-key.enc'),distKey=dec('dist-key.enc');
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KID,typ:'JWT'})).toString('base64url');const n=Math.floor(Date.now()/1000);
  const p=Buffer.from(JSON.stringify({iss:ISS,iat:n,exp:n+1100,aud:'appstoreconnect-v1'})).toString('base64url');
  const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:p8,dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
async function api(method,url,body){const r=await fetch('https://api.appstoreconnect.apple.com'+url,{method,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const txt=await r.text();if(!r.ok)throw new Error(`${method} ${url} -> ${r.status}: ${txt.slice(0,600)}`);return txt?JSON.parse(txt):{};}
const mySpki=crypto.createPublicKey(distKey).export({type:'spki',format:'der'}).toString('base64');
(async()=>{
  // 1) Sertifika: bizim anahtarımıza ait geçerli bir dağıtım sertifikası var mı?
  const certs=(await api('GET','/v1/certificates?limit=200')).data||[];let cert=null;
  for(const c of certs){const a=c.attributes;if(!/DISTRIBUTION/.test(a.certificateType)||!a.certificateContent)continue;
    try{const x=new crypto.X509Certificate(Buffer.from(a.certificateContent,'base64'));if(x.publicKey.export({type:'spki',format:'der'}).toString('base64')===mySpki&&new Date(x.validTo)>new Date()){cert=c;break;}}catch(e){}}
  if(cert)console.log('Mevcut sertifika kullanılıyor:',cert.attributes.name||cert.id);
  else{const kp=path.join(TMP,'dist-key.pem');fs.writeFileSync(kp,distKey,{mode:0o600});
    const csr=execSync(`openssl req -new -key "${kp}" -subj "/CN=Koyden Sehre CI/C=TR"`).toString();
    const body=csr.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'');
    try{cert=(await api('POST','/v1/certificates',{data:{type:'certificates',attributes:{certificateType:'DISTRIBUTION',csrContent:body}}})).data;}
    catch(e){console.error('\n::error::Apple sertifika oluşturmayı reddetti. Büyük ihtimalle sertifika sınırı dolu: developer.apple.com > Certificates bölümünden eski "Apple Distribution" sertifikalarını iptal edip (Revoke) yeniden çalıştır.\n');throw e;}
    console.log('Yeni dağıtım sertifikası oluşturuldu (bundan sonra hep bu kullanılacak).');}
  // 2) Anahtar + sertifika -> p12
  const kp=path.join(TMP,'dist-key.pem'),cp=path.join(TMP,'dist-cert.pem'),p12=path.join(TMP,'dist.p12'),p12pass='ci'+crypto.randomBytes(6).toString('hex');
  fs.writeFileSync(kp,distKey,{mode:0o600});
  fs.writeFileSync(cp,'-----BEGIN CERTIFICATE-----\n'+cert.attributes.certificateContent.match(/.{1,64}/g).join('\n')+'\n-----END CERTIFICATE-----\n');
  try{execSync(`openssl pkcs12 -export -legacy -inkey "${kp}" -in "${cp}" -out "${p12}" -passout pass:${p12pass}`,{stdio:'pipe'});}
  catch(e){execSync(`openssl pkcs12 -export -inkey "${kp}" -in "${cp}" -out "${p12}" -passout pass:${p12pass}`);}
  // 3-4) Bundle ID + App Store profili (uygulama ve ana ekran araç takımı için ayrı ayrı)
  async function profilHazirla(bundle,ad,profilAdi){
    let bid=((await api('GET','/v1/bundleIds?filter[identifier]='+bundle)).data||[]).find(b=>b.attributes.identifier===bundle);
    if(!bid)bid=(await api('POST','/v1/bundleIds',{data:{type:'bundleIds',attributes:{identifier:bundle,name:ad,platform:'IOS'}}})).data;
    let prof=null;const profs=(await api('GET','/v1/profiles?filter[name]='+encodeURIComponent(profilAdi)+'&limit=50')).data||[];
    for(const p of profs){let ok=p.attributes.profileState==='ACTIVE';if(ok){const pc=(await api('GET','/v1/profiles/'+p.id+'/certificates')).data||[];ok=pc.some(c=>c.id===cert.id);}
      if(ok&&!prof)prof=p;else await api('DELETE','/v1/profiles/'+p.id).catch(()=>{});}
    if(!prof)prof=(await api('POST','/v1/profiles',{data:{type:'profiles',attributes:{name:profilAdi,profileType:'IOS_APP_STORE'},
      relationships:{bundleId:{data:{type:'bundleIds',id:bid.id}},certificates:{data:[{type:'certificates',id:cert.id}]}}}})).data;
    const a=prof.attributes,content=Buffer.from(a.profileContent,'base64');
    for(const dir of[path.join(os.homedir(),'Library/MobileDevice/Provisioning Profiles'),path.join(os.homedir(),'Library/Developer/Xcode/UserData/Provisioning Profiles')]){
      fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,a.uuid+'.mobileprovision'),content);}
    console.log('Profil hazır:',profilAdi,a.uuid);return a;
  }
  const a=await profilHazirla(BUNDLE,'Kuran Hadis Zikir',PROFILE);
  const w=await profilHazirla(WIDGET_BUNDLE,'Kuran Hadis Zikir Widget',WIDGET_PROFILE);
  fs.writeFileSync(path.join(TMP,'signing.env'),`PROFILE_NAME="${PROFILE}"\nPROFILE_UUID="${a.uuid}"\nWIDGET_PROFILE_NAME="${WIDGET_PROFILE}"\nWIDGET_PROFILE_UUID="${w.uuid}"\nP12="${p12}"\nP12_PASS="${p12pass}"\n`);
})().catch(e=>{console.error(e.message||e);process.exit(1);});
