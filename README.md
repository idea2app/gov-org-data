# 事业单位目录数据

基于 [JSDOM](https://github.com/jsdom/jsdom) 实现的 Node.js 爬虫小工具。

爬取所有正在招聘的事业单位职位名录，数据来源：https://sc.huatu.com/syzwb/

## 数据字段

1. 职位代码 `code`
2. 职位名称 `name`
3. 工作地区 `district`
4. 招聘部门 `department`
5. 职位人数 `positions`
6. 招考对象 `object`
7. 年龄要求 `age`
8. 学历要求 `degree`
9. 专业要求 `majors`

## 使用方法

### 1. 将项目复制到本地

```bash
git clone https://github.com/idea2app/gov-org-data
```

### 2. 在本地安装依赖

```bash
pnpm i
```

### 3. 运行爬虫脚本

```bash
pnpm crawl 网页地址 --output 生成文件名
```

#### 3.1 若只爬取单个网页

```bash
pnpm crawl https://sc.huatu.com/syzwb/2021/1/buweisearch/1.html
```

#### 3.2 若爬取多个网页

```bash
pnpm crawl https://sc.huatu.com/syzwb/2021/1/buweisearch/1.html https://sc.huatu.com/syzwb/2021/8/buweisearch/1.html
```

#### 3.3 命名生成文件

- 默认在根目录生成 `data.json` 存储爬取数据
- 支持生成 `.json` `.yaml` `.yml` `.csv` 格式的任意命名文件，如：

```bash
pnpm crawl https://sc.huatu.com/syzwb/2021/1/buweisearch/1.html --output test.csv
```
