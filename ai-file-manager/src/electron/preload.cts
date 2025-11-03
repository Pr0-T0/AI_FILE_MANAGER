const electron = require('electron');

electron.contextBridge.exposeInMainWorld("electron",{
    //add functions to expose to front end HERE....
    getStaticData: () => console.log('static'),
})