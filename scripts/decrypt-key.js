// Şifreli App Store Connect anahtarını çözer. Şifre GitHub Secret'ta (KEY_PASS) durur.
const fs=require('fs'),crypto=require('crypto');
const pass=process.env.KEY_PASS;if(!pass){console.error('KEY_PASS secret eksik');process.exit(1);}
const b=Buffer.from(fs.readFileSync(__dirname+'/../secrets/asc-key.enc','utf8').trim(),'base64');
const salt=b.subarray(0,16),iv=b.subarray(16,28),tag=b.subarray(28,44),data=b.subarray(44);
const key=crypto.scryptSync(pass,salt,32);
const d=crypto.createDecipheriv('aes-256-gcm',key,iv);d.setAuthTag(tag);
process.stdout.write(Buffer.concat([d.update(data),d.final()]));
