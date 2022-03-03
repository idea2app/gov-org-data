var Crawler = require("crawler");
const cheerio = require('cheerio');
const fs = require('fs');
const c = new Crawler({
    maxConnections: 10
});

// 所有爬虫链接
const urls = [
    'https://sc.huatu.com/syzwb/2021/1/buweisearch/1.html', 
    'https://sc.huatu.com/syzwb/2021/8/buweisearch/1.html',
    'https://sc.huatu.com/syzwb/2022/2/buweisearch/1.html',
];

let promiseList = [];
urls.forEach(v => {
    promiseList.push(spiderItem(v));
})

Promise.all(promiseList).then(ress => {

    var datas = ress.reduce(function (a, b) { return a.concat(b) });
    datas = Array.from(new Set(datas))

    fs.writeFile(__dirname + '/data.json', JSON.stringify(
        datas
    ), function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log(datas.length + "条记录，成功写入完成")
        }
    })
})

function spiderItem(url) {
    return new Promise((resolve, reject) => {
        c.queue([{
            uri: url,
            jQuery: true,
            callback: function (error, res, done) {
                if (error) {
                    reject(error);
                } else {
                    const $ = cheerio.load(res.body)
                    const datas = []
                    $('li h4').each(function () {
                        let orgName = $(this).text();
                        orgName = orgName.replace(/(\（[^\)]*\）)/,'')
                        if(orgName.indexOf('所属事业单位') != -1){
                           return;
                        }
                        if(!(/^([^、，])*$/.test(orgName))){
                            const names = (orgName.split('、').length > 1) ? orgName.split('、') : orgName.split('，');
                            for(i in names){
                                orgName = names[i];
                            }
                        }
                        orgName = orgName.replace(/(各)[0-9](人|名)/,'')
                        orgName = orgName.replace(/[0-9](人|名)/,'')
                        datas.push(orgName);
                    })
                    resolve(datas)
                }
                done();
            }
        }]);
    })
}