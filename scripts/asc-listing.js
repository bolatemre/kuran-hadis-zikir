// App Store sayfasını App Store Connect API ile doldurur: kategori, ad/alt başlık, açıklama, anahtar kelimeler,
// destek/gizlilik adresleri, telif, ekran görüntüleri, yaş derecelendirmesi. Her adım bağımsız; biri hata verirse diğerleri devam eder.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const KEY_ID=process.env.ASC_KEY_ID,ISS=process.env.ASC_ISSUER_ID,BUNDLE=process.env.BUNDLE_ID,KEYFILE=process.env.ASC_KEY_FILE;
const ROOT=path.join(__dirname,'..'),T=JSON.parse(fs.readFileSync(path.join(__dirname,'store-texts.json'),'utf8'));
const SHOTDIR=path.join(ROOT,'store','ios-6.9-1290x2796');
const b64u=b=>Buffer.from(b).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
function jwt(){const h=b64u(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})),now=Math.floor(Date.now()/1000);
  const p=b64u(JSON.stringify({iss:ISS,iat:now,exp:now+1100,aud:'appstoreconnect-v1'}));
  const sig=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(KEYFILE,'utf8'),dsaEncoding:'ieee-p1363'});return h+'.'+p+'.'+b64u(sig);}
let TOKEN=jwt(),tokAt=Date.now();
async function api(method,url,body){if(Date.now()-tokAt>900000){TOKEN=jwt();tokAt=Date.now();}
  const r=await fetch(url.startsWith('http')?url:'https://api.appstoreconnect.apple.com'+url,{method,headers:{Authorization:'Bearer '+TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null;}catch(e){}
  if(!r.ok){const e=new Error(method+' '+url+' → '+r.status+' '+(j&&j.errors?j.errors.map(x=>x.detail||x.title).join(' | '):txt.slice(0,300)));e.status=r.status;throw e;}return j;}
const log=(...a)=>console.log(...a);const results=[];
async function step(name,fn){try{await fn();results.push('✅ '+name);}catch(e){results.push('⚠️ '+name+': '+e.message);}}
(async()=>{
  const app=(await api('GET','/v1/apps?filter[bundleId]='+encodeURIComponent(BUNDLE))).data[0];if(!app)throw new Error('Uygulama bulunamadı');
  log('Uygulama:',app.attributes.name,app.id,'ana dil:',app.attributes.primaryLocale);
  const infos=(await api('GET',`/v1/apps/${app.id}/appInfos`)).data;
  const info=infos.find(i=>!['READY_FOR_DISTRIBUTION','READY_FOR_SALE'].includes(i.attributes.state||i.attributes.appStoreState))||infos[0];

  await step('İçerik hakları beyanı',()=>api('PATCH',`/v1/apps/${app.id}`,{data:{type:'apps',id:app.id,attributes:{contentRightsDeclaration:'USES_THIRD_PARTY_CONTENT'}}}));
  await step('Kategori: Başvuru Kaynakları, Yaşam Tarzı',()=>api('PATCH',`/v1/appInfos/${info.id}`,{data:{type:'appInfos',id:info.id,relationships:{
    primaryCategory:{data:{type:'appCategories',id:'REFERENCE'}},secondaryCategory:{data:{type:'appCategories',id:'LIFESTYLE'}}}}}));

  const infoLocs=(await api('GET',`/v1/appInfos/${info.id}/appInfoLocalizations`)).data;
  for(const[loc,t]of Object.entries(T.locales))await step(`Ad ve alt başlık (${loc})`,async()=>{
    const ex=infoLocs.find(l=>l.attributes.locale===loc),attrs={name:t.name,subtitle:t.subtitle,privacyPolicyUrl:T.privacyPolicyUrl};
    if(ex)await api('PATCH',`/v1/appInfoLocalizations/${ex.id}`,{data:{type:'appInfoLocalizations',id:ex.id,attributes:attrs}});
    else await api('POST','/v1/appInfoLocalizations',{data:{type:'appInfoLocalizations',attributes:{locale:loc,...attrs},relationships:{appInfo:{data:{type:'appInfos',id:info.id}}}}});});

  // düzenlenebilir sürüm (yoksa 1.0 oluştur)
  const vers=(await api('GET',`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`)).data;
  let ver=vers.find(v=>['PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED','METADATA_REJECTED','INVALID_BINARY'].includes(v.attributes.appStoreState||v.attributes.appVersionState));
  if(!ver)await step('Sürüm 1.0 oluştur',async()=>{ver=(await api('POST','/v1/appStoreVersions',{data:{type:'appStoreVersions',attributes:{platform:'IOS',versionString:'1.0'},relationships:{app:{data:{type:'apps',id:app.id}}}}})).data;});
  if(!ver){log(results.join('\n'));return;}
  log('Sürüm:',ver.attributes.versionString,ver.id);
  await step('Telif',()=>api('PATCH',`/v1/appStoreVersions/${ver.id}`,{data:{type:'appStoreVersions',id:ver.id,attributes:{copyright:T.copyright}}}));

  const vLocs=(await api('GET',`/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`)).data;
  const shots=fs.existsSync(SHOTDIR)?fs.readdirSync(SHOTDIR).filter(f=>/\.(png|jpe?g)$/i.test(f)).sort():[];
  for(const[loc,t]of Object.entries(T.locales)){
    let vl=vLocs.find(l=>l.attributes.locale===loc);
    await step(`Açıklama, anahtar kelimeler, adresler (${loc})`,async()=>{const attrs={description:t.description,keywords:t.keywords,promotionalText:t.promotionalText,supportUrl:T.supportUrl,marketingUrl:T.supportUrl};
      if(vl)await api('PATCH',`/v1/appStoreVersionLocalizations/${vl.id}`,{data:{type:'appStoreVersionLocalizations',id:vl.id,attributes:attrs}});
      else vl=(await api('POST','/v1/appStoreVersionLocalizations',{data:{type:'appStoreVersionLocalizations',attributes:{locale:loc,...attrs},relationships:{appStoreVersion:{data:{type:'appStoreVersions',id:ver.id}}}}})).data;});
    if(!vl||!shots.length){if(!shots.length)results.push('⏭️ Ekran görüntüleri: repoda store/ios-6.9-1290x2796 klasörü yok');continue;}
    await step(`Ekran görüntüleri (${loc}, ${shots.length} adet)`,async()=>{
      const sets=(await api('GET',`/v1/appStoreVersionLocalizations/${vl.id}/appScreenshotSets`)).data;
      let set=sets.find(s=>s.attributes.screenshotDisplayType==='APP_IPHONE_67');
      if(!set)set=(await api('POST','/v1/appScreenshotSets',{data:{type:'appScreenshotSets',attributes:{screenshotDisplayType:'APP_IPHONE_67'},relationships:{appStoreVersionLocalization:{data:{type:'appStoreVersionLocalizations',id:vl.id}}}}})).data;
      const old=(await api('GET',`/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data;
      if(old.length===shots.length&&!process.env.STORE_FORCE){log('  zaten yüklü, atlandı');return;}
      for(const o of old)await api('DELETE',`/v1/appScreenshots/${o.id}`);
      for(const f of shots){const buf=fs.readFileSync(path.join(SHOTDIR,f));
        const r=(await api('POST','/v1/appScreenshots',{data:{type:'appScreenshots',attributes:{fileName:f,fileSize:buf.length},relationships:{appScreenshotSet:{data:{type:'appScreenshotSets',id:set.id}}}}})).data;
        for(const op of r.attributes.uploadOperations){const hd={};for(const h of op.requestHeaders||[])hd[h.name]=h.value;
          const up=await fetch(op.url,{method:op.method,headers:hd,body:buf.subarray(op.offset,op.offset+op.length)});if(!up.ok)throw new Error('yükleme '+f+' '+up.status);}
        await api('PATCH',`/v1/appScreenshots/${r.id}`,{data:{type:'appScreenshots',id:r.id,attributes:{uploaded:true,sourceFileChecksum:crypto.createHash('md5').update(buf).digest('hex')}}});log('  yüklendi',f);}});}

  await step('Yaş derecelendirmesi (4+)',async()=>{const ar=(await api('GET',`/v1/appInfos/${info.id}/ageRatingDeclaration`)).data;
    const N='NONE',base={alcoholTobaccoOrDrugUseOrReferences:N,contests:N,gamblingSimulated:N,horrorOrFearThemes:N,matureOrSuggestiveThemes:N,medicalOrTreatmentInformation:N,
      profanityOrCrudeHumor:N,sexualContentGraphicAndNudity:N,sexualContentOrNudity:N,violenceCartoonOrFantasy:N,violenceRealistic:N,violenceRealisticProlongedGraphicOrSadistic:N,gambling:false,unrestrictedWebAccess:false};
    const extra={lootBox:false,messagingAndChat:false,userGeneratedContent:false,parentalControls:false,ageAssurance:false,healthOrWellnessTopics:false,gunsOrOtherWeapons:N,advertising:true};
    try{await api('PATCH',`/v1/ageRatingDeclarations/${ar.id}`,{data:{type:'ageRatingDeclarations',id:ar.id,attributes:{...base,...extra}}});}
    catch(e){await api('PATCH',`/v1/ageRatingDeclarations/${ar.id}`,{data:{type:'ageRatingDeclarations',id:ar.id,attributes:base}});}});

  log('\n===== App Store sayfası =====\n'+results.join('\n'));
})().catch(e=>{console.log('App Store sayfası güncellenemedi:',e.message);}).finally(()=>process.exit(0));
