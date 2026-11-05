// Android yükleme anahtarını (upload keystore) çözer. Şifre GitHub Secret'ta (KEY_PASS) durur.
const fs=require('fs'),crypto=require('crypto'),path=require('path'),os=require('os');
const pass=process.env.KEY_PASS;if(!pass){console.error('KEY_PASS secret eksik');process.exit(1);}
const b=Buffer.from(fs.readFileSync(path.join(__dirname,'..','secrets','android-upload.enc'),'utf8').trim(),'base64');
const d=crypto.createDecipheriv('aes-256-gcm',crypto.scryptSync(pass,b.subarray(0,16),32),b.subarray(16,28));d.setAuthTag(b.subarray(28,44));
const j=JSON.parse(Buffer.concat([d.update(b.subarray(44)),d.final()]).toString());
const TMP=process.env.RUNNER_TEMP||os.tmpdir(),ks=path.join(TMP,'upload.jks');
fs.writeFileSync(ks,Buffer.from(j.ks,'base64'),{mode:0o600});
fs.writeFileSync(path.join(TMP,'android.env'),`KS="${ks}"\nKS_PASS="${j.pass}"\nKS_ALIAS="${j.alias}"\n`,{mode:0o600});
console.log('Yükleme anahtarı hazır');
