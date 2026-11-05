// www/data/ogren.js içindeki yapay ses listesini JSON olarak yazar (scripts/ses-uret.py kullanır)
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'data', 'ogren.js'), 'utf8'), ctx);
process.stdout.write(JSON.stringify(ctx.sesListesi()));
