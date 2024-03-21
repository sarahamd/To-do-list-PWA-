window.onload = () => {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let db;
  const taskList = document.getElementById('list');  //
  const taskForm = document.getElementById('form');
  const title = document.getElementById('title');
  const hours = document.getElementById('hours');
  const minutes = document.getElementById('minutes');
  const day = document.getElementById('day');
  const month = document.getElementById('month');
  const year = document.getElementById('year');
  const notificationBtn = document.getElementById('enable');  //

  if (Notification.permission === 'denied' || Notification.permission === 'default') {
    notificationBtn.style.display = 'block';
  } else {
    notificationBtn.style.display = 'none';
  }


  const DBOpenRequest = window.indexedDB.open('toDoList', 4);

  

  DBOpenRequest.onsuccess = (event) => {

    db = DBOpenRequest.result;

    displayData();
  };

 
  DBOpenRequest.onupgradeneeded = (event) => {
    db = event.target.result;

   

    const objectStore = db.createObjectStore('toDoList', { keyPath: 'taskTitle' });

    objectStore.createIndex('hours', 'hours', { unique: false });
    objectStore.createIndex('minutes', 'minutes', { unique: false });
    objectStore.createIndex('day', 'day', { unique: false });
    objectStore.createIndex('month', 'month', { unique: false });
    objectStore.createIndex('year', 'year', { unique: false });

    objectStore.createIndex('notified', 'notified', { unique: false });

  };

  function displayData() {
    while (taskList.firstChild) {
      taskList.removeChild(taskList.lastChild);
    }

    const objectStore = db.transaction('toDoList').objectStore('toDoList');
    objectStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) {
        return;
      }
            const { hours, minutes, day, month, year, notified, taskTitle } = cursor.value;
      const ordDay = ordinal(day);

      const toDoText = `${taskTitle} — ${hours}:${minutes}, ${month} ${ordDay} ${year}.`;
      const listItem = createListItem(toDoText);

      if (notified === 'yes') {
        listItem.style.textDecoration = 'line-through';
        listItem.style.color = 'rgba(255, 0, 0, 0.5)';
      }

      taskList.appendChild(listItem);

      const deleteButton = document.createElement('button');
      listItem.appendChild(deleteButton);
      deleteButton.textContent = 'X';
      
      deleteButton.setAttribute('data-task', taskTitle);
      
      deleteButton.onclick = (event) => {
        deleteItem(event);
      };

      cursor.continue();
    };
  };

  taskForm.addEventListener('submit', addData, false);

  function addData(e) {
    e.preventDefault();

    if (title.value === '' || hours.value === null || minutes.value === null || day.value === '' || month.value === '' || year.value === null) {
      return;
    }
    
    const newItem = [
      { taskTitle: title.value, hours: hours.value, minutes: minutes.value, day: day.value, month: month.value, year: year.value, notified: 'no' },
    ];

    const transaction = db.transaction(['toDoList'], 'readwrite');

    transaction.oncomplete = () => {

      displayData();
    };

   

    const objectStore = transaction.objectStore('toDoList');
    console.log(objectStore.indexNames);
    console.log(objectStore.keyPath);
    console.log(objectStore.name);
    console.log(objectStore.transaction);
    console.log(objectStore.autoIncrement);

    const objectStoreRequest = objectStore.add(newItem[0]);
    objectStoreRequest.onsuccess = (event) => {


      title.value = '';
      hours.value = null;
      minutes.value = null;
      day.value = 1;
      month.value = 'January';
      year.value = 2020;
    };
  };

  function deleteItem(event) {
    const dataTask = event.target.getAttribute('data-task');

    const transaction = db.transaction(['toDoList'], 'readwrite');
    transaction.objectStore('toDoList').delete(dataTask);

    transaction.oncomplete = () => {
      event.target.parentNode.parentNode.removeChild(event.target.parentNode);
    };
  };

  function checkDeadlines() {
    if (Notification.permission === 'denied' || Notification.permission === 'default') {
      notificationBtn.style.display = 'block';
    } else {
      notificationBtn.style.display = 'none';
    }

    const now = new Date();

    const minuteCheck = now.getMinutes();
    const hourCheck = now.getHours();
    const dayCheck = now.getDate(); 
    const monthCheck = now.getMonth();
    const yearCheck = now.getFullYear(); 

    const objectStore = db.transaction(['toDoList'], 'readwrite').objectStore('toDoList');
    
    objectStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return;
      const { hours, minutes, day, month, year, notified, taskTitle } = cursor.value;

      const monthNumber = MONTHS.indexOf(month);
      if (monthNumber === -1) throw new Error('Incorrect month entered in database.');

      
      let matched = parseInt(hours) === hourCheck;
      matched &&= parseInt(minutes) === minuteCheck;
      matched &&= parseInt(day) === dayCheck;
      matched &&= parseInt(monthNumber) === monthCheck;
      matched &&= parseInt(year) === yearCheck;
      if (matched && notified === 'no') {
        if (Notification.permission === 'granted') {
          createNotification(taskTitle);
        }
      }

      cursor.continue();
    };
  };

  function askNotificationPermission() {
    function handlePermission(permission) {
      if (!Reflect.has(Notification, 'permission')) {
        Notification.permission = permission;
      }

      if (Notification.permission === 'denied' || Notification.permission === 'default') {
        notificationBtn.style.display = 'block';
      } else {
        notificationBtn.style.display = 'none';
      }
    };

    if (!Reflect.has(window, 'Notification')) {
      console.log('This browser does not support notifications.');
    } else {
      if (checkNotificationPromise()) {
        Notification.requestPermission().then(handlePermission);
      } else {
        Notification.requestPermission(handlePermission);
      }
    }
  };

  function checkNotificationPromise() {
    try {
      Notification.requestPermission().then();
    } catch(e) {
      return false;
    }

    return true;
  };

  notificationBtn.addEventListener('click', askNotificationPermission);

  function createListItem(contents) {
    const listItem = document.createElement('li');
    listItem.textContent = contents;
    return listItem;
  };

  function createNotification(title) {
    const text = `HEY! Your task "${title}" is now overdue.`;
    const notification = new Notification('To do list', { body: text, icon: img });

    
    const objectStore = db.transaction(['toDoList'], 'readwrite').objectStore('toDoList');

    const objectStoreTitleRequest = objectStore.get(title);

    objectStoreTitleRequest.onsuccess = () => {
      const data = objectStoreTitleRequest.result;

      data.notified = 'yes';

      const updateTitleRequest = objectStore.put(data);

      updateTitleRequest.onsuccess = () => {
        displayData();
      };
    };
  };

  setInterval(checkDeadlines, 1000);
}

function ordinal(day) {
  const n = day.toString();
  const last = n.slice(-1);
  if (last === '1' && n !== '11') return `${n}st`;
  if (last === '2' && n !== '12') return `${n}nd`;
  if (last === '3' && n !== '13') return `${n}rd`;
  return `${n}th`;
};
