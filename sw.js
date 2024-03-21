self.addEventListener('notificationclick',event=>{
    console.log(event.notification)
    const notification = event.notification
    const primaryKey = notification.data.primaryKey
    const action = event.action
    if(action==='close'){
        notification.close()
    }
    else{
        console.log(clients)
        clients.openWindow('samples/page1.html')
        notification.close()
    }
})