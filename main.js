var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require("fs");
var Image = require("images");
var app = express();
var host, port = 8887;

app.use(cookieParser());
app.use(session({
    secret: '12345',
    name: 'node_session',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: { maxAge: 600000 },  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
    resave: false,
    saveUninitialized: true,
}));


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded



var server = app.listen(port, function () {
    host = server.address().address;
    port = server.address().port;

});

app.use(express.static('static'));

app.all('/', function (req, res) {
    res.redirect("/index.html");
});







var verifys = [];//所有验证图片
var i_files = fs.readdirSync("./verifyImg/");//验证图片的文件夹
i_files.forEach(function (file) {//遍历获取
    if (!fs.lstatSync("./verifyImg/" + file).isDirectory()) {
        if (/\.jpg$/.test(file) || /\.png/.test(file)) {
            verifys.push(file);
        }
    }
});

//图片接口，
app.all('/getVerifyImg', function (req, res) {
    var imgConfig = {
        width: 600,
        height: 600
    };
    var fileName = verifys[parseInt(Math.random() * verifys.length)];
    var simg = Image("./verifyImg/" + fileName);//原图
    imgConfig.width = simg.width();
    imgConfig.height = simg.height();

    var imgs = [];//原图分块
    var img = Image(imgConfig.width, imgConfig.height);//响应图片
    for (var i = 0; i < 9; i++) {
        imgs[i] = Image(simg, i % 3 * imgConfig.width / 3, parseInt(i / 3) * imgConfig.height / 3, imgConfig.width / 3, imgConfig.height / 3);
    }

    var p1 = 0, p2 = 0;
    while (p1 == p2) {
        p1 = parseInt(Math.random() * 9);
        p2 = parseInt(Math.random() * 9);
    }
    var strArray = "";
    for (var i = 0; i < 9; i++) {
        var sIndex = i;
        if (i == p1) {
            sIndex = p2;
        } else if (i == p2) {
            sIndex = p1;
        }
        img.draw(imgs[sIndex], i % 3 * imgConfig.width / 3, parseInt(i / 3) * imgConfig.height / 3);
        strArray += "-" + sIndex;
    }
    req.session.verify_img = strArray;
    req.session.verify_img_error = 0;
    res.send(img.encode("jpg"));
});

//验证接口
app.post('/verifyImg', function (req, res) {
    if (req.body.sort != null && req.body.sort == req.session.verify_img) {
        req.session.verify_send = true;
        res.send("1");//验证成功
    } else {
        req.session.verify_img_error = parseInt(req.session.verify_img_error) + 1;
        if (parseInt(req.session.verify_img_error) >= 3) {
            res.send("3");//超过三次换图
            req.session.verify_img = null;
        } else {
            res.send("0");//验证失败
        }
    }
});