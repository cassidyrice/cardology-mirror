const {app,BrowserWindow,ipcMain,dialog,Menu} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const pages = ['index.html','report.html'].map(name=>pathToFileURL(path.join(__dirname,'ui',name)).href);
let win;
function createWindow(){
  win = new BrowserWindow({title:'My Card Blueprint Reports',width:1440,height:1000,minWidth:900,minHeight:650,backgroundColor:'#ffffff',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(!pages.includes(url))event.preventDefault();});
  win.webContents.on('will-prevent-unload',event=>{
    const response=dialog.showMessageBoxSync(win,{type:'question',buttons:['Keep editing','Discard changes'],defaultId:0,cancelId:0,message:'You have unsaved report changes.',detail:'Save a draft before leaving to keep your edits.'});
    if(response===1)event.preventDefault();
  });
  win.loadFile(path.join(__dirname,'ui/report.html'));
}
app.whenReady().then(()=>{
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'My Card Blueprint Reports',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]},{label:'Edit',submenu:[{role:'undo'},{role:'redo'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]}]));
  ipcMain.handle('save-json',async(event,json)=>{
    if(event.sender!==win.webContents || typeof json!=='string' || json.length>2000000)throw new Error('Invalid export');
    JSON.parse(json);
    const result=await dialog.showSaveDialog(win,{defaultPath:'card-blueprints.json',filters:[{name:'JSON',extensions:['json']}]});
    if(result.canceled)return false;
    await fs.writeFile(result.filePath,json,'utf8');return true;
  });
  ipcMain.handle('print',async event=>{if(event.sender===win.webContents)win.webContents.print({printBackground:true});});
  ipcMain.handle('open-report-draft',async event=>{
    if(event.sender!==win.webContents)throw Error('Invalid window');
    const result=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Report draft',extensions:['json']}]});
    if(result.canceled)return null;const file=result.filePaths[0];
    if((await fs.stat(file)).size>200000)throw Error('Draft file is too large');return fs.readFile(file,'utf8');
  });
  ipcMain.handle('save-report',async(event,payload)=>{
    if(event.sender!==win.webContents||!payload||!['draft','engine','html','pdf'].includes(payload.kind)||typeof payload.content!=='string'||payload.content.length>4000000||typeof payload.name!=='string')throw Error('Invalid report export');
    if(['draft','engine'].includes(payload.kind))JSON.parse(payload.content);
    const ext={draft:'json',engine:'json',html:'html',pdf:'pdf'}[payload.kind];
    const result=await dialog.showSaveDialog(win,{defaultPath:path.basename(payload.name),filters:[{name:payload.kind==='draft'?'Report draft':ext.toUpperCase(),extensions:[ext]}]});
    if(result.canceled)return false;
    if(payload.kind!=='pdf'){await fs.writeFile(result.filePath,payload.content,{encoding:'utf8',mode:0o600});return true;}
    const directory=await fs.mkdtemp(path.join(os.tmpdir(),'card-blueprints-report-'));await fs.chmod(directory,0o700);
    let printWindow;
    try{
      const input=path.join(directory,'report.html');await fs.writeFile(input,payload.content,{mode:0o600});
      printWindow=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,javascript:false,partition:'report-export'}});
      printWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
      printWindow.webContents.on('will-navigate',event=>event.preventDefault());
      printWindow.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
      await printWindow.loadFile(input);
      const pdf=await printWindow.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,pageSize:'A4'});
      await fs.writeFile(result.filePath,pdf,{mode:0o600});return true;
    }finally{if(printWindow&&!printWindow.isDestroyed())printWindow.destroy();await fs.rm(directory,{recursive:true,force:true});}
  });
  createWindow();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
