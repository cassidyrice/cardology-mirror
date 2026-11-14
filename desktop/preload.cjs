const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  save:json=>ipcRenderer.invoke('save-json',json),print:()=>ipcRenderer.invoke('print'),
  saveReport:payload=>ipcRenderer.invoke('save-report',payload),
  openReportDraft:()=>ipcRenderer.invoke('open-report-draft')
});
