/**
 * Canvas Puzzle Game
 * @author Cloud xunuoi@163.com
 */

;(function(_global){

    /* PUZZLE */
    var PUZZLE_DIFFICULTY = 3;
    var PUZZLE_HOVER_TINT = '#009900';
    var PUZZLE_TIME = 20;

    var _conf = {};
    var _$timeCtn;
    var _$result;
    var _t_id;
    var cur_time;

    var _stage;
    var _$canvas;
    var _$body;
    var _$puzzle;

    var _img;
    var _pieces;
    var _puzzleWidth;
    var _puzzleHeight;
    var _pieceWidth;
    var _pieceHeight;
    var _currentPiece;
    var _currentDropPiece;  

    var _mouse;

    var eventsMap  = {
            select: "click",
            down: "mousedown",
            up: "mouseup",
            move: "mousemove"
        };
    var touchSupported = false;

    // We have a set API for handling events that typically map to mouse events
    // But if the device supports touch events then we'll use those instead
    if (Modernizr.touch) {
        touchSupported = true;
        eventsMap  = {
            select: "touchstart",
            down: "touchstart",
            up: "touchend",
            move: "touchmove"
        };
    }
    function setVars(rawConf){
        //pre for dom
        _$body = $(document.body)
        _$puzzle = $('.puzzle-container')
        _$timeCtn = $(rawConf['time_ctn'] || '#time_remain')
        _$result = $('.result-tip')
        _$canvas = $('#canvas')

        //set config
        rawConf['level'] ? PUZZLE_DIFFICULTY = parseInt(rawConf['level']) : ''
        //set time
        rawConf['time'] ? (PUZZLE_TIME = cur_time = parseInt(rawConf['time']), _$timeCtn.html(PUZZLE_TIME)) : ''

        //set fn ===========
        //config
        _conf['fnOnGameWin'] = rawConf['onWin'];
        _conf['fnOnGameLost'] = rawConf['onLost'];

    }
    function init(rawConf){
        setVars(rawConf)

        _img = new Image()
        _img.addEventListener('load',onImage,false)
        _img.src = rawConf['img']

    }
    function onImage(e){
        _pieceWidth = Math.floor(_img.width / PUZZLE_DIFFICULTY)
        _pieceHeight = Math.floor(_img.height / PUZZLE_DIFFICULTY)
        _puzzleWidth = _pieceWidth * PUZZLE_DIFFICULTY;
        _puzzleHeight = _pieceHeight * PUZZLE_DIFFICULTY;

        setCanvas();
        initPuzzle();
    }
    function setCanvas(){
        _stage = _$canvas[0].getContext('2d');
        _$canvas[0].width = _puzzleWidth;
        _$canvas[0].height = _puzzleHeight;
        // _$canvas[0].style.border = "1px solid #004D3D";
    }
    function initPuzzle(){
        _pieces = [];
        _mouse = {x:0,y:0};
        _currentPiece = null;
        _currentDropPiece = null;
        _stage.drawImage(_img, 0, 0, _puzzleWidth, _puzzleHeight, 0, 0, _puzzleWidth, _puzzleHeight);
        
        _$body.removeClass('loading')

        _$result.on('click touchend', '#replay .ir', function(e){
            e.preventDefault();
            location.reload()
        })

        buildPieces();
    }

    function initTime(){
        _t_id = setInterval(function(){
            cur_time--
            if(cur_time<=0){
                _$timeCtn.html(0)
                gameLost()
            }else {
               _$timeCtn.html(cur_time) 
            }
        }, 1000)
    }
    function clearTime(){
        clearInterval(_t_id)
        // _t_id ? clearInterval(_t_id) : ''
    }

    function buildPieces(){
        var i;
        var piece;
        var xPos = 0;
        var yPos = 0;
        for(i = 0;i < PUZZLE_DIFFICULTY * PUZZLE_DIFFICULTY;i++){
            piece = {};
            piece.sx = xPos;
            piece.sy = yPos;
            _pieces.push(piece);
            xPos += _pieceWidth;
            if(xPos >= _puzzleWidth){
                xPos = 0;
                yPos += _pieceHeight;
            }
        }

        _$puzzle.on('click touchend', '#play .ir', function(e){
            e.preventDefault();
            //检测是否支持，并且屏幕是否横屏、尺寸等
            /*if( Modernizr.touch && Modernizr.mq('(min-width: 950px) and (orientation: landscape)')){
                M.util.goFullScreen();
            }*/
            

            $('#play').fadeOut( 888 , function(){
                shufflePuzzle();
                //倒计时
                initTime();
            });
        });
    }
    function shufflePuzzle(){
        _pieces = shuffleArray(_pieces);
        _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
        var i;
        var piece;
        var xPos = 0;
        var yPos = 0;
        for(i = 0;i < _pieces.length;i++){
            piece = _pieces[i];
            piece.xPos = xPos;
            piece.yPos = yPos;
            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, xPos, yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(xPos, yPos, _pieceWidth,_pieceHeight);
            xPos += _pieceWidth;
            if(xPos >= _puzzleWidth){
                xPos = 0;
                yPos += _pieceHeight;
            }
        }
        if( !touchSupported ){
            _$canvas.on('mousedown', onPuzzleClick);
        }else{
            // document.ontouchstart = null;
            _$canvas.on('touchstart',function( e ){
                 var e = e.originalEvent;
                 e.preventDefault();
                 onPuzzleClick( e ); 
            });
        }
    }
    function onPuzzleClick(e){
        // alert(e);

        if( !Modernizr.touch ){
            _mouse.x = e.pageX - _$canvas.offset().left;
            _mouse.y = e.pageY - _$canvas.offset().top;
        }else{
            _mouse.x = e.touches[0].pageX - _$canvas.offset().left;
            _mouse.y = e.touches[0].pageY - _$canvas.offset().top;
        }
        
        // alert("x "+_mouse.x+" y: "+_mouse.y);
        _currentPiece = checkPieceClicked();
        if(_currentPiece != null){
            _stage.clearRect(_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);
            _stage.save();
            _stage.globalAlpha = .9;
            _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
            _stage.restore();

            if( !touchSupported ){
                document.onmousemove = updatePuzzle;
                document.onmouseup = pieceDropped;
            }else{
                _$canvas.bind( 'touchmove', function(e){
                    var e = e.originalEvent;
                    updatePuzzle(e);
                });
                
                _$canvas.bind( 'touchend', function(ev){
                    var e = ev.originalEvent;
                    pieceDropped(e);
                });
            }
        }
    }
    function checkPieceClicked(){
        var i;
        var piece;
        for(i = 0;i < _pieces.length;i++){
            piece = _pieces[i];
            if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                //PIECE NOT HIT
            }
            else{
                return piece;
            }
        }
        return null;
    }
    function updatePuzzle(e){

        e.preventDefault();
        e.stopPropagation();

        _currentDropPiece = null;

        if( !Modernizr.touch ){
            _mouse.x = e.pageX - _$canvas.offset().left;
            _mouse.y = e.pageY - _$canvas.offset().top;
        }else{
            _mouse.x = e.touches[0].pageX - _$canvas.offset().left;
            _mouse.y = e.touches[0].pageY - _$canvas.offset().top;
        }
        
        _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
        var i;
        var piece;
        for(i = 0;i < _pieces.length;i++){
            piece = _pieces[i];
            if(piece == _currentPiece){
                continue;
            }
            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth,_pieceHeight);
            if(_currentDropPiece == null){
                if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                    //NOT OVER
                }
                else{
                    _currentDropPiece = piece;
                    _stage.save();
                    _stage.globalAlpha = .4;
                    _stage.fillStyle = PUZZLE_HOVER_TINT;
                    _stage.fillRect(_currentDropPiece.xPos,_currentDropPiece.yPos,_pieceWidth, _pieceHeight);
                    _stage.restore();
                }
            }
        }
        _stage.save();
        _stage.globalAlpha = .6;
        _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
        _stage.restore();
        _stage.strokeRect( _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth,_pieceHeight);
    }
    function pieceDropped(e){
        if( !touchSupported ){
            document.onmousemove = null;
            document.onmouseup = null;
        }else{
            // _$canvas.unbind( 'touchmove' );
            _$canvas.unbind( 'touchend' ); 
        }

        if(_currentDropPiece != null){
            var tmp = {xPos:_currentPiece.xPos,yPos:_currentPiece.yPos};
            _currentPiece.xPos = _currentDropPiece.xPos;
            _currentPiece.yPos = _currentDropPiece.yPos;
            _currentDropPiece.xPos = tmp.xPos;
            _currentDropPiece.yPos = tmp.yPos;
        }
        resetPuzzleAndCheckWin();
    }
    function resetPuzzleAndCheckWin(){
        _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);

        var gameWin = true;
        var i;
        var piece;
        for(i = 0;i < _pieces.length;i++){
            piece = _pieces[i];
            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth,_pieceHeight);
            if(piece.xPos != piece.sx || piece.yPos != piece.sy){
                gameWin = false;
            }
        }
        if(gameWin){
            setTimeout(gameSuccess,500);
        }
    }
    function gameOver(){
        clearTime()
        document.onmousedown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        _$canvas.unbind()
        
        var last_time = parseInt(_$timeCtn.html())
        var use_time = PUZZLE_TIME - last_time

        // M.util.exitFullscreen() 

        return {
            'last_time': last_time,
            'use_time': use_time
        }
    }
    function gameSuccess(){
        var rsTimeDict = gameOver()

        //游戏成功结束
        _conf['fnOnGameWin'] ? _conf['fnOnGameWin'](rsTimeDict, _$puzzle, _$result, PUZZLE_DIFFICULTY, PUZZLE_TIME) : ''
    }
    function gameLost(){
        var rsTimeDict = gameOver()
        //游戏失败结束
        _conf['fnOnGameLost'] ? _conf['fnOnGameLost'](rsTimeDict, _$puzzle, _$result, PUZZLE_DIFFICULTY, PUZZLE_TIME) : ''
    }

    function shuffleArray(o){
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }

    //export api to global
    _global.puzzle = {
        'init': init
    }
})(window);


//for puzzle play ===========
$(function(){

function playPuzzle(){
    var _randomImgList = [
            'm07.jpg', 
            'm08.jpg', 
            'm09.jpg', 
            'm10.jpg', 
            'm11.jpg', 
            'm12.jpg', 
            'm13.jpg', 
            'm14.jpg'
        ],
        _imgSrc = _randomImgList[M.util.getRandom(0, 7)],
        urlObj = M.util.urlToObj()
    // alert(_imgSrc)
    puzzle.init({
        'time': urlObj['t'] || 20,
        'level': urlObj['level'] || 3,
        'img': 'img/poster/'+_imgSrc,
        'onWin': function(rsTimeDict, $p, $r, level, pt){
            document.title = '用时'+rsTimeDict['use_time']+'秒，快来挑战他/她！'
            if(level <= 3){
                alert('算你屌！敢不敢继续挑战高难度？')
                var newLevel = level+1;
                var newPt = pt+25;

                $p.remove();
                $r.html('<h3>用时<i class="f-red">'+rsTimeDict['use_time']+'</i>秒！算你屌,有种挑战高难度？</br>\
                    <img src="img/emoji/cool.jpg" /></h3>\
                    <a href="/static/tmp/puzzle/?level='+newLevel+'&t='+newPt+'" ><span class="ir f-red">点我挑战！</span></a>\
                    <h3>点击右上角，分享到朋友圈！</h3><div>访问<a href="http://maov.cc">maov.cc</a>，查看更多电影、影评！</div>').show()
            }else{
                alert('好吧，你牛逼！快去炫耀吧！')

                $p.remove();
                $r.html('<h3>用时<i class="f-red">'+rsTimeDict['use_time']+'</i>秒！牛逼,赶紧炫耀去吧！</br>\
                    <img src="img/emoji/cool.jpg" /></h3>\
                    <h3>点击右上角，分享到朋友圈吧！</h3><div>访问<a href="http://maov.cc">maov.cc</a>，查看更多电影、影评！</div>').show()
            }
        },
        'onLost': function(rsTimeDict, $p, $r, pt){
            // initPuzzle()
            alert('时间到啦，行不行啊你？再努力一把！')
            $p.remove()

            $r.html('<h3>行不行啊你？再玩一把!<img src="img/emoji/weak.jpg" /></h3><a href="#" id="replay"><span class="ir">Replay</span></a><div></h3><div>访问<a href="http://maov.cc">maov.cc</a>，查看更多电影、影评！</div>').show()
        }
    }) 
}

//begin
playPuzzle()

})