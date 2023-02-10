// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') { 
            connect();
        }
    });

    if (window.settings.username) connect();
})

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {

        $('#stateText').text('Connecting...');

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Connected to roomId ${state.roomId}`);

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert('no username entered');
    }
}


document.addEventListener('DOMContentLoaded', () => { 

    const startTimeInput = document.getElementById("startTimeInput");
    const countdownEl = document.getElementById("countdownEl");
    const messageEl = document.getElementById("messageEl");
    const addTimeInput = document.getElementById("addTimeInput");
    const resetTimeBtn = document.getElementById("resetTimeBtn");
    
    let startTime = localStorage.getItem("startTime") || null;
    
    if (startTime) {
        startTime = parseInt(startTime);
        messageEl.style.display = "none";
        resetTimeBtn.style.display = "none";
        countdownEl.style.display = "block";
    }
    
    let timeoutId;
    let timeLeft;
    
    function updateCountdown(timeLeft) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
        countdownEl.innerHTML = `${days} Dias ${hours} Horas ${minutes} Minutos ${seconds} Segundos`;
    }
    
    function countdown() {
        const now = new Date().getTime();
        timeLeft = startTime - now;
    
        if (timeLeft < 0) {
            messageEl.innerHTML = "Stream Finalizado";
            messageEl.style.display = "block";
            countdownEl.style.display = "none";
            resetTimeBtn.style.display = "block";
            return;
        }
    
        updateCountdown(timeLeft);
        timeoutId = setTimeout(countdown, 1000);
    }
    
    const pauseBtn = document.getElementById("pause-btn");
    pauseBtn.addEventListener("click", function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
            pauseBtn.innerHTML = "Reanudar";
        } else {
            timeoutId = setTimeout(countdown, 1000);
            pauseBtn.innerHTML = "Pausar";
        }
    });
    
    if (startTime) {
        countdown();
    }
    
    startTimeInput.addEventListener("change", function () {
        startTime = new Date(startTimeInput.value).getTime();
        localStorage.setItem("startTime", startTime);
        messageEl.style.display = "none";
        resetTimeBtn.style.display = "none";
        countdownEl.style.display = "block";
        countdown();
    });
    
    resetTimeBtn.addEventListener("click", function () {
        localStorage.removeItem("startTime");
        startTime = null;
        messageEl.style.display = "none";
        resetTimeBtn.style.display = "none";
        countdownEl.style.display = "block";
    });


      addTimeBtn.addEventListener("click", function() {
        
        const addTime = parseInt(addTimeInput.value) * 1000;
        if (document.getElementById("doubleTimeCheckbox").checked) {
            startTime += addTime*2;
        }else{
            startTime += addTime;
        }
    
        messageEl.style.display = "none";
        resetTimeBtn.style.display = "none";
        countdownEl.style.display = "block";
        countdown();

    
 
  
     


   

      });

  
      let prevDiamondsCount = 0;

      function diamonsContador(){
      
          const addTime = parseInt(addTimeInput.value) * 1000;
      
          if (document.getElementById("doubleTimeCheckbox").checked) {
              startTime += (addTime * (diamondsCount - prevDiamondsCount))*2;
          }else{
              startTime += addTime * (diamondsCount - prevDiamondsCount);
          }
      
          prevDiamondsCount = diamondsCount;
      
          messageEl.style.display = "none";
          resetTimeBtn.style.display = "none";
          countdownEl.style.display = "block";
          countdown();
      
      }
       
    // New gift received
connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        
       updateRoomStats();
        diamonsContador();
    }

    if (window.settings.showGifts === "0") return;
  
    addGiftItem(data);
})



   
});


// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
    $('#minutacos').html(`${diamondsCount.toLocaleString()}`);
    $('#roomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Earned Diamonds: <b>${diamondsCount.toLocaleString()}</b>`)
}

function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new message to the chat container
 */
function addChatItem(color, data, text, summarize) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();;

    container.append(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
            </span>
        </div>
    `);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
}

/**
 * Add a new gift to the gift container
 */
let minutitos = 0;
function addGiftItem(data) {
    //console.log(diamondsCount);
  
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Repeat: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                            </td>
                        </tr>
                    </tabl>
                </div>
            </span>
        </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
        
    }

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);

    
}




// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`))
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#21b2c2', msg, 'joined', true);
    }, joinMsgDelay);
})

// New chat comment received
connection.on('chat', (msg) => {
    if (window.settings.showChats === "0") return;

    addChatItem('', msg, msg.comment);
})



// share, follow
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

connection.on('streamEnd', () => {
    $('#stateText').text('Stream ended.');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})


