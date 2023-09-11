const Crawler = require('crawler');
const cheerio = require('cheerio');
const { promises } = require('fs');

const crawler = new Crawler({ maxConnections: 10 });

// 所有爬虫链接
const urls = [
    'https://sc.huatu.com/syzwb/2021/1/buweisearch/1.html',
    'https://sc.huatu.com/syzwb/2021/8/buweisearch/1.html',
    'https://sc.huatu.com/syzwb/2022/2/buweisearch/1.html',
];

const promiseList = urls.map(async (uri) => {
    var finish;

    const { body } = await new Promise((resolve, reject) =>
        crawler.queue([
            {
                uri,
                jQuery: true,
                callback(error, res, done) {
                    finish = done;
                    error ? reject(error) : resolve(res);
                },
            },
        ])
    );
    const $ = cheerio.load(body);

    finish();

    return [...$('li h4')]
        .map((item) => {
            const orgName = $(item)
                .text()
                .replace(/（.+?）/g, '');

            return !orgName.includes('所属事业单位') && orgName.split(/、|，/);
        })
        .filter(Boolean);
});

Promise.all(promiseList).then(async (list) => {
    var data = [...new Set(list.flat(Infinity))];

    await promises.writeFile('data.json', JSON.stringify(data));

    console.log(data.length + '条记录，成功写入完成');
});
