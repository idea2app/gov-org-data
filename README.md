# 事业单位目录数据

基于 [JSDOM](https://github.com/jsdom/jsdom) 实现的 node 爬虫小工具。

爬取四川所有正在招聘的 2021-2022 年事业单位名录，爬取数据来源：

-   https://sc.huatu.com/syzwb/2021/1/buweisearch/1.html
-   https://sc.huatu.com/syzwb/2021/8/buweisearch/1.html
-   https://sc.huatu.com/syzwb/2022/2/buweisearch/1.html

数据格式包含：

1. 单位名称 `name`
2. 招考职位 `positions`
3. 招考人数 `vacancies`
4. 报名人数 `applicants`

## 使用方法

1. 将项目复制到本地

```
git clone git@github.com:idea2app/gov-org-data.git
```

2. 在本地安装依赖

```
pnpm i
```

3. 运行爬虫脚本

```
pnpm crawl
```

-   默认在根目录生成 `data.json` 存储爬取数据
-   支持生成 `.json` `.yaml` `.yml` `.csv` 格式的任意命名文件，只需在步骤三命令后添加需要生产的文件名和格式，如：

```
pnpm crawl result.csv
```
