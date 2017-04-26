
(function () {
    var submit = $("#submit"),        // 生成节点
    clearBtn = $("#clearBtn"),      // 重置
    hideLine = $("#hideLine"),      // 隐藏连线
    hideNode = $("#hideNode"),      // 隐藏节点
    nodeInfo = $("#nodeInfo"),      // 节点信息
    nodeSite = $("#nodeSite"),      // 节点坐标
    selectModel = $("#selectModel"),    // 选择模型
    showGird = $("#showGird"),        // 显示坐标网
    showIdBtn = $("#showIdBtn"),     // 显示节点编号按钮
    pauseBtn = $("#pauseBtn"),        // 暂停按钮
    nodeInfoBtn = $("#nodeInfoBtn"),  // 显示节点信息按钮
    nodeInfoBox = $("#nodeInfoBox"),  // 节点信息区域
    nodeInfoBoxTable = $("#nodeInfoBoxTable"),  // 节点信息表格
    leftAreaBox = $("#leftAreaBox"),   // 左侧功能区域
    nodeControl = $("#nodeControl"),   // 控制器
    nodeStatus = $("#nodeStatus"),     // 节点状态区域
    nodeStatusColor = $("#nodeStatusColor"),  // 节点状态颜色标志
    activeBtn = $("#activeBtn"),   // 节点激活按钮
    xmBtn = $("#xmBtn"),  //节点休眠按钮
    actionBtn = $("#actionBtn"),   // 功能确定按钮
    powerBtn = $("#powerBtn"),   // 功率确定按钮
    activeAllBtn = $("#activeAllBtn"),  // 激活所有按钮
    xmAllBtn = $("#xmAllBtn"),   //  休眠所有按钮
    saveDataBtn = $("#saveDataBtn"),  // 保存数据
    actionInput = $("#actionInput"), // 功能input
    actionSelect = $("#actionSelect"),  // 功能选择
    hideAll = $("#hideAll"),   // 隐藏所有面板
    showAllBox = $("#showAllBox"),  // 显示所有
    dataBtn = $("#dataBtn"),    // 所有轮次数据记录按钮
    dataBox = $("#dataBox"),
    box = $("#box"),
    dataBoxTable = $("#dataBoxTable"),
    model,          // 节点模型
    nodeActiveNum = 0,  // 激活节点数
    nodeXmNum = 0,      // 休眠节点数
    nodeDieNum = 0,     // 死亡节点数

    mouseX = 0,
    mouseY = 0,

    windowHalfX = window.innerWidth / 2,
    windowHalfY = window.innerHeight / 2,

    camera,   // 相机
    scene,    // 场景
    renderer;  // 渲染器


submit.click(function () {
    var nodeNum = $("#nodeNum").val();
    // 判断输入的是否为数字
    if (isValidNum(nodeNum)) {
        // 球形 随机
        model = selectModel.val();
        init(nodeNum);
        leftAreaBox.show();
        nodeStatusColor.show();
        animate();
        // 点击确定之后禁用确定按钮
        this.disabled = "true";
    }
    else {
        return 0;
    }
});

// 当点重置按钮时，刷新网页
clearBtn.click(function () {
    window.location.reload(true);
});

var toggle = (function () {
    var a = true;
    return function (fn1, fn2) {
        a = !a;
        var toggler = function () {
            if (a) {
                return fn1;
            } else {
                return fn2;
            }
        };
        return this.onclick = toggler();
    }
})();

// 初始化函数
function init(nodeNum) {

    // 节点初始能量值
    var nodeInitEnergy = 100,
        // 节点坐标数组
        xArr = [],
        yArr = [],
        zArr = [],
        container,
        cameraZ = 800;  // 相机z轴默认距离

    // 右上角小功能模块，使用 dat.gui.js
    var controls = new function() {
        this.x = 100;
        this.y = 100;
        this.z = 800;
        this.nodeSize = 20;
        this.redraw = function () {
            camera.position.set(controls.x, controls.y, controls.z);
            for (var i = 0; i < nodeNum; i++) {
                particles[i].scale.set(controls.nodeSize, controls.nodeSize, 1);
            }
        };
    };

    var gui = new dat.GUI();
    // gui.add(controls, 'x', 100, 1000).onChange(controls.redraw);
    // gui.add(controls, 'y', 100, 1000).onChange(controls.redraw);
    gui.add(controls, 'z', 100, 3000).onChange(controls.redraw);
    gui.add(controls, 'nodeSize', 10,200).onChange(controls.redraw);
    // gui.add(controls, 'nodeSize', 10,200).onChange(controls.redraw);

    container = document.createElement('div');
    document.body.appendChild(container);
    // 75
    camera = new THREE.PerspectiveCamera( 85, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = cameraZ;

    scene = new THREE.Scene();

    renderer = new THREE.CanvasRenderer();
    // renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.setClearColor(0x39C6F4);
    container.appendChild( renderer.domElement );

    // 隐藏所有
    hideAll.on("click", function () {
        box.hide();
        leftAreaBox.hide();
        nodeInfoBox.hide();
        nodeStatusColor.hide();
        dataBox.hide();
        showAllBox.show();
    });

    showAllBox.on("click",function () {
        box.show();
        leftAreaBox.show();
        nodeInfoBox.show();
        nodeStatusColor.show();
        showAllBox.hide();
    });


    // 节点材质数组，等一个节点对应一种材质，用来改颜色
    var spriteMaterials = [];

    var PI2 = Math.PI * 2;

    for (var i = 0;i < nodeNum; i++) {
        spriteMaterials.push( new THREE.SpriteCanvasMaterial( {
            color: 0x00ff00,  // 节点的颜色
            program: function ( context ) {

                context.beginPath();
                context.arc( 0, 0, 0.5, 0, PI2, true );
                context.fill();
            }
        }));
    }

    var controlMaterial = new THREE.SpriteCanvasMaterial( {
        color: 0xff00ff,  // 节点的颜色
        program: function ( context ) {

            context.beginPath();
            context.arc( 0, 0, 0.5, 0, PI2, true );
            context.fill();
        }
    });

    // 节点能量数组，每一个节点对应一个能量值，初始能量值相同，用来改变能量值
    var nodeEnergy = [];
    for (var i = 0; i < nodeNum; i++) {
        nodeEnergy[i] = nodeInitEnergy;
    }


    // 产生每个节点的随机x y z坐标
    for ( var i = 0; i < nodeNum; i ++ ) {
        xArr[i] = Math.random() * 2 - 1;
        yArr[i] = Math.random() * 2 - 1;
        zArr[i] = Math.random() * 2 - 1;
    }


    var geometry = new THREE.Geometry();
    // particles 颗粒
    var particle;
    // 节点数组用来存储所有节点
    var particles = [];

    for ( var i = 0; i < nodeNum; i ++ ) {
        particle = new THREE.Sprite(spriteMaterials[i]);

        particles.push(particle);

        particles[i].position.x = xArr[i];
        particles[i].position.y = yArr[i];
        particles[i].position.z = zArr[i];

        if (model == "sphere") {
            // 使坐标呈比例变化
            particle.position.normalize();  // 可以后整个网的形状控制为球形，使正常化，归一化函数,可以控制球形分布与随机分布
        }
        if (model == "cube") {

        }

        // xArr[i]*450 = particles[i].position.x
        particle.position.multiplyScalar( 450 );  // 产生的随机坐标，乘450之后才是真实的坐标,
        //            particle.position.multiplyScalar( Math.random() * 10 + 450 );
        particle.scale.x = particle.scale.y = 20;  // 节点的大小 另一种写法 particle.scale.set(10, 10, 1);

        scene.add( particle );  // 将节点加入到场景中,产生点
    }

    // 连线
    // 假设有三个点 0 1 2 则产生数组 01 02 12 会产生5条线，则0 1 2间的三条线中有两条线是由两线重合而成的，一条线是单独的一条线，单独的那条线是02
    // 第一个点与最后一个点之间是一条线，其余点之间是两条线
    // a 个节点产生数组长度为 坐标位置的个数为 a(a - 1) , 产生的线条数为 a(a - 1) - 1

    // 控制器节点
    var controlGeometry = new THREE.Geometry();
    var controlNode = new THREE.Sprite(controlMaterial);
    controlNode.position.x = -800;
    controlNode.position.y = 400;
    controlNode.position.z = 0;
    controlNode.scale.set(40,40,1);
    scene.add(controlNode);

    for (var i = 0; i < nodeNum; i++) {
        controlGeometry.vertices.push(controlNode.position);
        controlGeometry.vertices.push(particles[i].position);
    }

    var controlLine = new THREE.Line( controlGeometry, new THREE.LineBasicMaterial( { color: lineColor, opacity: 0.5 } ) );

    scene.add(controlLine);

    //*************************************************************************

    var nodePositionArr = [];  // 节点位置标志数组


    (function () {
        for (var i = 0; i < nodeNum;i++) {
            for (var j = i+1; j < nodeNum;j++) {
                geometry.vertices.push(particles[i].position);
                geometry.vertices.push(particles[j].position);
                nodePositionArr.push(i);
                nodePositionArr.push(j);
            }
        }
    })();

    nodeSite.children("p").html(nodePositionArr);


    // 显示、隐藏节点
    hideNode.get(0).onclick = function () {
        toggle(function () {
            for (var i = 0; i < nodeNum; i++) {
                scene.remove(particles[i]);
            }
            $(this).attr("value","显示节点");
        }, function () {
            for (var i = 0; i < nodeNum; i++) {
                scene.add(particles[i]);
                $(this).attr("value","隐藏节点");
            }
        });
    };

    // 显示节点信息
    nodeInfoBox.show();
    nodeInfoBtn.click(function () {
        nodeInfoBox.toggle();
    });

    //显示 隐藏数据
    dataBtn.click(function () {
        dataBox.toggle();
    });


    // 1 激活
    // 2 休眠
    // 0 死亡
    var colorFlag = [];
    for (var i = 0; i < nodeNum; i++) {
        colorFlag[i] = 1;
    }
    var nodeState = [];
    for (var i = 0; i < nodeNum; i++) {
        nodeState[i] = "激活";
    }
    // 随机激活  随机休眠
    var random = [];
    var timer = null;
    var time = 0;   // 从节点生成到节点全部死亡的时间
    var randomFlag = 0;
    // var turn = [];   // 轮次数组，每个节点一个轮次
    // for (var i = 0; i < nodeNum; i++) {
    //     turn[i] = 0;
    // }

    var turn = 1,
        turnArr = [0],
        // 死亡数组
        dieArr = [1],
        temp = -1;

    var powerArr = [];

    for (var i = 0; i < nodeNum; i++) {
        powerArr[i] = 100;
    }



    // var w = 0;
    var hh = nodeNum;

    var nowTime = getCurrentTime();  // 当前时间，生成节点的时间


    // 生成指定范围指定个数的不重复随机数
    var randomArray = [];
    for (var i=0;i < nodeNum;i++){
        randomArray[i]=i;
    }
    randomArray.sort(function(){ return 0.5 - Math.random(); });


    //------------------------------------------------------------------------
    // 激活按钮
    activeBtn.click(function () {
        var activeNum = $("#activeNum").val() - 1;
        if (!isValidNum(activeNum) || activeNum+1 > nodeNum || activeNum+1 <= 0) {
            alert("请输入有效数字");
            return;
        }
        // 首先判断节点存活状态
        if (colorFlag[activeNum] === 0) {
            alert((activeNum+1)+" 号节点已死亡");
            return;
        }
        if (colorFlag[activeNum] == 1) {
            alert((activeNum+1)+" 号节点的当前状态为激活");
            return;
        }

        // 激活数组
        // activeNumArr.push(activeNum);
        // 颜色变绿
        spriteMaterials[activeNum].color = new THREE.Color(0x00ff00);
        // 连线
        for (var j = 0; j < nodePositionArr.length; j++) {
            if (nodePositionArr[j] == activeNum) {
                geometry.vertices.splice(j,1,particles[activeNum].position);
            }
        }

        nodeInfoBoxTable.find("tr").eq(activeNum+1).css("color","#0f0");
        nodeInfoBoxTable.find("tr").eq(activeNum+1).find("td").eq(1).html("激活");
        $("#activeNum").val("");

        colorFlag[activeNum] = 1;

        spriteMaterials[activeNum].color = new THREE.Color(0x00ff00);

        // 轮次加1
        turn++;
        turnArr.push(turn);


        // alert(random);

        for (var i = 0; i < random.length; i++) {
            if (random[i] == activeNum) {
                random.splice(i,1);
            }
        }

        // alert(random);

    });

    // 休眠按钮
    xmBtn.click(function () {
        var xmNum = $("#xmNum").val() - 1;
        if (!isValidNum(xmNum) || xmNum+1 > nodeNum || xmNum+1 <= 0) {
            alert("请输入有效数字");
            return;
        }
        // 首先判断节点存活状态
        if (colorFlag[xmNum] === 0) {
            alert((xmNum+1)+" 号节点已死亡");
            return;
        }
        if (colorFlag[xmNum] == 2) {
            alert((xmNum+1)+" 号节点的当前状态为休眠");
            return;
        }

        // 休眠数组
        // xmNumArr.push(xmNum);
        // 变黄
        spriteMaterials[xmNum].color = new THREE.Color(0xFFA500);
        // 断线
        for (var j = 0; j < nodePositionArr.length; j++) {
            if (nodePositionArr[j] == xmNum) {
                geometry.vertices.splice(j,1,"q");
            }
        }


        nodeInfoBoxTable.find("tr").eq(xmNum+1).css("color","#ff0");
        nodeInfoBoxTable.find("tr").eq(xmNum+1).find("td").eq(1).html("休眠");
        $("#xmNum").val("");

        colorFlag[xmNum] = 2;

        spriteMaterials[xmNum].color = new THREE.Color(0x00ffff);

        random.push(xmNum);

        // 轮次加1
        turn++;
        turnArr.push(turn);

        // alert(randomArray);
        // 从randomArray数组中将休眠的节点删除，防止其再次删除
        for (var j = 0; j < randomArray.length; j++) {
            if (randomArray[j] == xmNum) {
                randomArray.splice(j,1);
                hh--;
            }
        }
        // alert(randomArray);

    });

    // 功能转换
    var action = [];

    for (var i = 0; i < nodeNum; i++) {
        action[i] = "温度";
    }

    actionBtn.on("click", function () {
        var actionVal = actionSelect.val();
        var actionNum = actionInput.val() - 1;

        if (!isValidNum(actionNum) || actionNum+1 > nodeNum || actionNum+1 <= 0) {
            // alert("请输入有效数字");
            return;
        }
        // 首先判断节点存活状态
        if (colorFlag[actionNum] === 0) {
            return;
        }

        if (actionVal == "wd") {
            action[actionNum] = "温度";
        }
        if (actionVal == "ph") {
            action[actionNum] = "PH";
        }

    });

    powerBtn.on("click", function () {
        var powerVal = $("#powerSelect").val();
        var powerNum = $("#powerInput").val() - 1;

        if (!isValidNum(powerNum) || powerNum+1 > nodeNum || powerNum+1 <= 0) {
            // alert("请输入有效数字");
            return;
        }
        // 首先判断节点存活状态
        if (colorFlag[powerNum] === 0) {
            return;
        }

        if (powerVal == "powerNum1") {
            // action[actionNum] = "温度";
            powerArr[powerNum] = 100;
        }
        if (powerVal == "powerNum2") {
            powerArr[powerNum] = 200;
        }

    });



    // 定时器函数
    function fun () {

        // 休眠之后已经从激活数组中删除，所以不需要再加2
        // for (var e = 0; e < xmNumArr.length; e++) {
        //     // colorFlag[xmNumArr[e]] = 2;
        //     nodeEnergy[xmNumArr[e]]+=2;
        // }


        // 当节点全部死亡，清除定时器
        if (nodeDieNum == nodeNum) {
            clearInterval(timer);
        }

        dieArr.push(nodeDieNum);

        if (dieArr[dieArr.length-1] > dieArr[dieArr.length-2]) {
            turn++;
            turnArr.push(turn);
        }

        // 隔多少秒有节点休眠随机，如果产生的随机数小于5，就会有节点休眠
        var random2 = Math.floor(Math.random()*10);  // 0 - 10
        // var random3 = Math.floor(Math.random()*5);
        if (random2 < 3) {
            // if (1) {
            if (randomFlag < hh && random.length < nodeNum ) {
                // 每次休眠节点个数随机，休眠节点的个数由产生的随机数决定
                random.push(randomArray[randomFlag]);
                randomFlag++;
                turn++;
                turnArr.push(turn);
            }
        }

        for (var i = 0;i < nodeNum; i++) {
            if (powerArr[i] == 100) {
                nodeEnergy[i] -= 2; // 功率是100的激活的节点每秒电量减2
            }
            if (powerArr[i] == 200) {
                nodeEnergy[i] -= 4; // 功率是200的激活的节点每秒电量减4
            }

            if (nodeEnergy[i] < 0) {
                nodeEnergy[i] = 0;
                spriteMaterials[i].color = new THREE.Color(0xff0000); // 如果能量值小于0,则节点颜色变为红色
                colorFlag[i] = 0;
                // random.splice(i,1);
                // 节点死亡后，将其从休眠数组中删除，防止颜色再变为黄色
                for (var n = 0; n < random.length; n++) {
                    if (random[n] == i) {
                        random.splice(n,1);
                    }
                }
            }
        }





        //
        for (var j = 0; j < random.length; j++) {
            spriteMaterials[random[j]].color = new THREE.Color(0xFFA500); //
            colorFlag[random[j]] = 2;  // 休眠对应颜色标志数组的值为2
            if (powerArr[j] == 100) {
                nodeEnergy[random[j]]+=1;   //
            }
            if (powerArr[j] == 200) {
                nodeEnergy[random[j]]+=2;
            }

            // 控制器激活某个节点使其颜色变为绿色，colorFlag = 1
            // for (var h = 0; h < activeNumArr.length; h++) {
            //     if (random[j] == activeNumArr[h]) {
            //         spriteMaterials[random[j]].color = new THREE.Color(0x00ff00);
            //         colorFlag[random[j]] = 1;
            //         nodeEnergy[random[j]] -=2;
            //     }
            // }
        }


        if (random2 < 3) {
            for (var k = 0; k < nodePositionArr.length; k++) {
                if (random[random.length-1] == nodePositionArr[k]) {
                    geometry.vertices.splice(k,1,"q");
                    // nodePositionArr.splice(k,1,"q");
                    nodeSite.children("p").html(nodePositionArr);
                }
            }
            // w++;
        }

        nodeActiveNum = 0;
        nodeXmNum = 0;
        nodeDieNum = 0;

        for (var i = 0; i < nodeNum; i++) {
            turn[i]++;
            if (colorFlag[i] == 1) {
                nodeActiveNum++;
                nodeState[i] = "激活";
            }
            if (colorFlag[i] == 2) {
                nodeXmNum++;
                nodeState[i] = "休眠";
            }
            if (colorFlag[i] === 0) {
                nodeDieNum++;
                nodeState[i] = "死亡";
                turn[i]--;
                if (i === 0) {
                    controlGeometry.vertices.splice(1,1,0);
                }
                else {
                    controlGeometry.vertices.splice(2*i+1,1,0);
                }
                for (var b = 0; b < nodePositionArr.length; b++) {
                    if ( i == nodePositionArr[b]) {
                        geometry.vertices.splice(b,1,"q");
                        // nodePositionArr.splice(b,1,"q");
                        nodeSite.children("p").html(nodePositionArr);
                    }
                }
            }
        }

        // 每秒用时加1
        time++;


        nodeStatus.children("p").html("总数 "+nodeNum+"<br> 激活 "+nodeActiveNum+"<br> 休眠 "+nodeXmNum+"<br> 死亡 " +nodeDieNum+"<br> 用时 "+time+"<br>生成时间 "+nowTime);


        nodeInfoBoxTable.html("");
        nodeInfoBoxTable.append("<tr><td>编号</td><td>状态</td><td>电量</td><td>轮次</td><td>功能</td><td>功率</td><td>x</td><td>y</td><td>z</td></tr>");

        for (var i = 0; i < nodeNum;i++) {
            var t = i+1;
            nodeInfoBoxTable.append("<tr><td>"+t+"</td><td>"+nodeState[i]+"</td><td>"+nodeEnergy[i]+"</td><td>"+turn+"</td><td>"+action[i]+"</td><td>"+powerArr[i]+"</td><td>"+(particles[i].position.x + "").slice(0,6)+"</td><td>"+(particles[i].position.y + "").slice(0,6)+"</td><td>"+(particles[i].position.z + "").slice(0,6)+"</td></tr>");
            if (nodeState[i] == "激活") {
                nodeInfoBoxTable.find("tr").eq(i+1).css("color","#0f0");
            }
            if (nodeState[i] == "休眠") {
                nodeInfoBoxTable.find("tr").eq(i+1).css("color","#FFA500");
            }
            if (nodeState[i] == "死亡") {
                nodeInfoBoxTable.find("tr").eq(i+1).css("color","#f00");
            }

            // 每次都将数据存入数据库
            /*            $.ajax({
             type: "post",
             url: "SaveData",
             data: {id: t, status: nodeState[i], energy: nodeEnergy[i], turn: turn[i], action: action[i], x: (particles[i].position.x + "").slice(0,8), y:(particles[i].position.y + "").slice(0,8), z:(particles[i].position.z + "").slice(0,8)},
             success: function (data, textStatus) {
             if (data=="success") {
             //alert("保存成功");
             } else {
             //alert("保存失败");
             }
             }
             });*/

            //

        }


        if (turnArr[turnArr.length - 1] > temp) {
            dataBoxTable.append("<tr><td>编号</td><td>状态</td><td>电量</td><td>轮次</td><td>功能</td><td>x</td><td>y</td><td>z</td></tr>");
        }

        for (var i = 0; i < nodeNum; i++) {

            var t = i + 1;
            if (turnArr[turnArr.length - 1] > temp) {
                dataBoxTable.append("<tr><td>" + t + "</td><td>" + nodeState[i] + "</td><td>" + nodeEnergy[i] + "</td><td>" + turn + "</td><td>" + action[i] + "</td><td>" + (particles[i].position.x + "").slice(0, 8) + "</td><td>" + (particles[i].position.y + "").slice(0, 8) + "</td><td>" + (particles[i].position.z + "").slice(0, 8) + "</td></tr>");
            }

        }

        temp = turnArr[turnArr.length-1];


    }

    timer = setInterval(fun,1000);


    var pauseFlag = 1;
    pauseBtn.click(function () {
        if (pauseFlag == 1) {
            clearInterval(timer);
            pauseBtn.attr("value","开始");
            pauseFlag = 2;
        }
        else {
            timer = setInterval(fun,1000);
            pauseBtn.attr("value","暂停");
            pauseFlag = 1;
        }
    });

    // 保存数据
    saveDataBtn.on("click",function () {
        if (nodeDieNum !=nodeNum) {
            alert("当所有节点全部死亡，可保存本次实验数据");
            return;
        }

    });


    // 网格
    var size1 = 500, step1 = 20;

    var geometry1 = new THREE.Geometry();

    // 底面 x
    for ( var i = - size1; i <= size1; i += step1 ) {

        geometry1.vertices.push( new THREE.Vector3( - size1, 0, i ) );
        geometry1.vertices.push( new THREE.Vector3(   size1, 0, i ) );

        geometry1.vertices.push( new THREE.Vector3( i, 0, - size1 ) );
        geometry1.vertices.push( new THREE.Vector3( i, 0,   size1 ) );

    }

    // 侧面 z
    var size2 = 500, step2 = 20;
    var geometry2 = new THREE.Geometry();

    for ( var i = - size2; i <= size2; i += step2 ) {

        geometry2.vertices.push( new THREE.Vector3( 0, - size2, i ) );
        geometry2.vertices.push( new THREE.Vector3( 0, size2, i ) );

        geometry2.vertices.push( new THREE.Vector3( 0, i, - size2 ) );
        geometry2.vertices.push( new THREE.Vector3( 0, i,   size2 ) );

    }

    // 正面 y
    var size3 = 500, step3 = 20;
    var geometry3 = new THREE.Geometry();

    for ( var i = - size3; i <= size3; i += step3 ) {

        geometry1.vertices.push( new THREE.Vector3( - size3, i, 0 ) );
        geometry1.vertices.push( new THREE.Vector3(   size3, i, 0 ) );

        geometry1.vertices.push( new THREE.Vector3( i, - size3, 0  ) );
        geometry1.vertices.push( new THREE.Vector3( i, size3, 0 ) );

    }

    var material1 = new THREE.LineBasicMaterial( { color: 0x00ff00, opacity: 0.5, transparent: true } );

    var line1 = new THREE.LineSegments( geometry1, material1 );
    var line2 = new THREE.LineSegments( geometry2, material1 );
    var line3 = new THREE.LineSegments( geometry3, material1 );

    var showGirdFlag = 1;
    showGird.click(function () {
        if (showGirdFlag == 1) {
            scene.add( line1 );
            scene.add( line2 );
            scene.add( line3 );
            showGirdFlag = 2;
            $(this).attr("value","隐藏网格");
        }
        else {
            scene.remove( line1 );
            scene.remove( line2 );
            scene.remove( line3 );
            showGirdFlag = 1;
            $(this).attr("value","显示网格");
        }
    });

    // ***************************************************************************

    var lineColor = 0xffffff;
    // lines
    var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: lineColor, opacity: 0.5 } ) );
    // 虚线
    // var line = new THREE.Line( geometry, new THREE.LineDashedMaterial( { color: 0xffffff, opacity: 0.5 } ) );
    scene.add( line );

    // 删除和添加线
    var toggleLineFlag = 1;
    hideLine.click(function () {
        if (toggleLineFlag == 1) {
            scene.remove(line);  // 从场景中移除线
            $(this).attr("value","显示连线");
            toggleLineFlag = 2;
        }
        else {
            scene.add(line);
            $(this).attr("value","隐藏连线");
            toggleLineFlag = 1;
        }
    });

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    // 随浏览器窗口大小改变而自适应
    window.addEventListener( 'resize', onWindowResize, false );

    nodeSiteScroll();

    setTimeout(function () {
        if (nodeInfoBox.height() > 650) {
            nodeInfoBox.addClass("nodeInfoBoxScroll");
        }
    },1000);


    // 节点信息区域可拖动
    nodeInfoBox.draggable();
    // 相机位置区域可拖动
    nodeInfo.draggable();
    // 节点状态区域可拖动
    nodeStatus.draggable();
    // 控制器可以拖动
    nodeControl.draggable();
    // 节点状态颜色标志可拖动
    nodeStatusColor.draggable();
}

// init end

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// 如果nodeSite高度大于 120 加滚动条
function nodeSiteScroll() {
    if (nodeSite.height() > 120) {
        nodeSite.addClass("nodeSite");
    }
}

//
function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

// 判断输入的是否是数字
function isValidNum (num) {
    var pattern = /^\d+$/;
    return pattern.test(num);
}

// 判断是否为空
function isEmpty () {

}

// 获取当前时间
function getCurrentTime () {
    var currentTime = "";
    var date = new Date();
    var year = date.getFullYear();  // 年
    var month = date.getMonth() + 1; // 月
    var day = date.getDate();     // 日
    var hours = date.getHours();  // 时
    var minute = date.getMinutes();  // 分
    var second = date.getSeconds();  // 秒
    var millisecond = date.getMilliseconds();  // 毫秒
    return currentTime = year+"/"+month+"/"+day+" "+hours+":"+minute+":"+second;
}

// 动画
function animate() {
    requestAnimationFrame( animate );
    render();
}

// 渲染
function render() {
    camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    camera.position.y += ( - mouseY + 200 - camera.position.y ) * 0.05;
    nodeInfo.children("p").html("X: "+camera.position.x+"<br> Y: "+camera.position.y+"<br> Z: "+camera.position.z);
    camera.lookAt( scene.position );

    renderer.render( scene, camera );
}
})();

