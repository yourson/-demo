window.onload = function () {
    //取消body的touchmove默认行为，阻止页面滚动
    // true - 事件句柄在捕获阶段执行  false- false- 默认。事件句柄在冒泡阶段执行
    document.body.addEventListener('touchmove', function (event) {
        event.preventDefault();
    },false)

    let songTitle = document.querySelector('.song-title'); // 歌名标签节点
    let singer = document.querySelector('.singer'); // 作曲家标签节点
    let recordImg = document.querySelector('.record-pic img'); // 专辑图片
    let recordPic = document.querySelector('.record-pic'); // 专辑图片外层div节点
    let recordWrap = document.querySelector('.record-wrapper'); // 专辑区域
    let lyrics = document.querySelector('.lyrics'); // 歌词包裹节点
    let channel = document.querySelector('.channel'); // 频道标签节点
    let progressBar = document.querySelector('.progress-bar'); // 进度条外层div
    let progress = document.querySelector('.progress'); // 进度条长度
    let progressBtn = document.querySelector('.progress-btn'); // 进度条拖动按钮
    let lyricBtn = document.querySelector('.show-lyrics'); // 显示歌词按钮
    let changeChannelBtn = document.querySelector('.change-channel'); // 更换频道
    let playBtn = document.querySelector('.play'); // 播放按钮
    let nextBtn = document.querySelector('.next'); // 下一区按钮
    let modeBtn = document.querySelector('.mode'); // 切换播放模式
    let musicAudio = document.querySelector('#mic_audio'); // audio标签
    let bigBg = document.querySelector('.glass img'); // 大背景
    let lyricsLiArr = null; // 所有的li标签

    let num = 1;
    // 首次进入页面，chrome,safair在页面没有手动点击的时候，是不能自动播放音乐的，设定num变量标记第一次进入页面
    let channelArr = []; // 歌曲频道的数组

    getChannel();

    // 为play添加点击事件
    playBtn.onclick = () => {
        musicAudio.onplaying = null;  //  清除audio标签绑定的事件
        if (musicAudio.paused) { // paused：查看是否暂停
            playBtn.style.backgroundImage = 'url(img/播放.png)';
            musicAudio.play() // play：播放当前音乐
        } else {
            playBtn.style.backgroundImage = 'url(img/暂停.png)';
            musicAudio.pause() // pause：暂停当前音乐
        }
    };

    // 下一曲按钮
    nextBtn.onclick = () => {
        getMusic();
    };

    // 更换频道按钮
    changeChannelBtn.onclick = () => {
        getRandomChannel(channelArr);
        getMusic();
    };

    // mode更换模式按钮
    modeBtn.onclick = () => {
        if (musicAudio.loop) {
            musicAudio.loop = false;
            modeBtn.style.backgroundImage = 'url(./img/随机.png)';
        } else {
            musicAudio.loop = true;
            modeBtn.style.backgroundImage = 'url(./img/单曲循环.png)';
        }
    };

    // lyricBtn 歌词显示按钮
    lyricBtn.onclick = () => {
      if (recordWrap.style.display === 'block') {
          recordWrap.style.display = 'none';
          channel.style.fontSize = 0;
          if (!lyricsLiArr) {
              lyrics.innerHTML = '暂时没有歌词'
          }
      } else {
          recordWrap.style.display = 'block';
          channel.style.fontSize = '0.5rem';
      }
    };

    // 歌词动态显示模块
    if (lyricsLiArr) { // 判断是否有歌词
        for (let i = 0; i < lyricsLiArr.length; i++) {
            let curT = lyricsLiArr[i].getAttribute('data-time');
            let nexT = lyricsLiArr[i+1].getAttribute('data-time');
            // currentTime 属性设置或返回音频播放的当前位置（以秒计）
            let curtTime = musicAudio.currentTime;
            if (curtTime > curT && curtTime < nexT) {
                lyricsLiArr[i].className = 'active';
                lyrics.style.top = (100 - lyricsLiArr[i].offsetTop) + 'px';
            } else {
                lyricsLiArr[i].className = ''
            }
        }
    }


    // 获取频道
    function getChannel() {
        ajax({
            method: 'GET',
            url: 'http://api.jirengu.com/fm/getChannels.php',
            async: true,
            success: (res) => {
                // JSON.parse() 方法用于将一个 JSON 字符串转换为对象。
                let obj = JSON.parse(res);
                // 找到channels数组
                channelArr = obj['channels'];
                getRandomChannel(channelArr);
                getMusic();
            }
        })
    }
    // 获取随机频道
    function getRandomChannel(channelArr) {
        // 随机频道，并且转化为整数
        let randomNum = Math.floor(channelArr.length * Math.random());
        let randomChannel = channelArr[randomNum];
        // 获取频道的名字
        channel.innerHTML = randomChannel.name;
        // 添加指定的属性，并为其赋指定的值。如果属性存在，可以修改属性。
        channel.setAttribute('data-channel-id', randomChannel.channel_id);
    }
    // 获取音乐
    function getMusic() {
        ajax({
            method: 'GET',
            url: 'http://api.jirengu.com/fm/getSong.php',
            async: true,
            data: {
                // getAttribute() 方法返回指定属性名的属性值。
                'channel': channel.getAttribute('data-channel-id')
            },
            success: (res) => {
                let jsonObj = JSON.parse(res);
                let songObj = jsonObj['song'][0];
                // 作者 歌曲名字等等
                songTitle.innerHTML = songObj.title;
                singer.innerHTML = songObj.artist;
                recordImg.src = songObj.picture; // 专辑图片
                bigBg.src = songObj.picture; // 大背景
                musicAudio.src = songObj.url; // 播放歌曲地址

                musicAudio.setAttribute('data-sid', songObj.sid);
                musicAudio.setAttribute('data-ssid', songObj.ssid);
                getlyric(); // 获取歌词
                // 解决首次进入页面时，自动播放的兼容问题，不自动播放

            }
        })
    }
    // 获取歌词
    // 步骤：
    //   1.获取时间（正则表达式）
    //   2.设置
    function getlyric() {
        let sid = musicAudio.getAttribute('data-sid');
        let ssid = musicAudio.getAttribute('data-ssid');
        ajax({
            method: 'POST',
            url: 'http://api.jirengu.com/fm/getLyric.php',
            async: true,
            data: {
                sid: sid,
                ssid: ssid
            },
            success: (data) => {
                let lyricsObj = JSON.parse(data);
                if (lyricsObj.lyric) {
                    lyrics.innerHTML = ''; // 清空歌词，防止下一曲歌词占位置
                    let lineArr = lyricsObj.lyric.split('\n'); // split() 方法用于把一个字符串分割成字符串数组。
                    let timeReg = /\[\d{2}:\d{2}.\d{2}\]/g; // 检索时间的正则表达式
                    let result = [];

                    for (let i = 0; i < lineArr.length; i++) {
                        let time = lineArr[i].match(timeReg); // 获取时间
                        let curStr = lineArr[i].replace(timeReg,''); // 获取歌词
                        for (let j in time) {
                            let t = time[j].slice(1, -1).split(':'); // 时间的格式是[00:00.00] 分钟和毫秒是t[0],t[1]
                            // parseFloat() 解析字符串数字，直到结尾不是数字，返回一个数字。
                            // parseInt(数，进制) 函数可解析一个字符串，并返回一个整数。
                            let curSecond = parseInt(t[0],10) * 60 + parseFloat(t[1]);
                            result.push([curSecond,curStr]) // 将时间和歌词分别放入里面
                        }
                    }
                    console.log(result)
                    result.sort(function (a, b) {
                        return a[0] - b[0] // 给歌词时间排序
                    });
                    // 渲染歌词到界面
                    renderLyrics(result);
                }
            }
        })
    }
    // 添加歌词到页面中
    function renderLyrics(result) {
        let li = '';
        for (let i = 0; i < result.length; i++) {
            li += '<li  data-time="\' + lyricArr[i][0] + \'">' + result[i][1]+ '</li>'
        }
        lyrics.innerHTML = li; // 将li放到ul标签里面
        lyricsLiArr = lyrics.getElementsByTagName('li') // 获取所有的ul下面的li标签
    }
};



// ajax封装
function ajax(obj) {
    // obj传入的ajax（默认为一个空对象）
    obj = obj || {};
    // 提交的方式，默认为post
    obj.method = obj.method.toUpperCase() || "POST";
    // 提交的路径，默认为空
    obj.url = obj.url || '';
    // 是否异步，默认为异步
    obj.async = obj.async || 'true';
    // 设置传送到服务器端的数据的默认值，默认值为空
    obj.data = obj.data || '';
    // 成功执行函数
    obj.success = obj.success || function () {

    };
    let xmlHttp = null; // 创建对象
    if (XMLHttpRequest) {
        xmlHttp = new XMLHttpRequest();
    } else
    {
        xmlHttp = ActiveXObject('Microsoft.XMLHTTP')
    }
    let params = []; // 发送的默认参数
    for (let key in obj.data) {
        params.push(key + '=' + obj.data[key])
    }
    let postData = params.join('&');
    // GET 请求
    if (obj.method.toUpperCase() === 'GET') {
        xmlHttp.open(obj.method, obj.url + '?' + postData, obj.async);
        xmlHttp.send(null) // 发送请求，不要参数
    }else {
        if (obj.method.toUpperCase() === 'POST') {
            xmlHttp.open(obj.method, obj.url, obj.async)
            // 添加http头，发送信息至服务器时内容编码类型
            xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
            xmlHttp.send(postData);
        }
    }
    // 接收
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            obj.success(xmlHttp.responseText) // 响应返回的主体内容，为字符串类型；
        }
    }
}
