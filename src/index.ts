import 'array-unique-proposal';
import { outputFile, outputJSON } from 'fs-extra';
import { JSDOM } from 'jsdom';
import { RestMigrator, YAMLListModel } from 'mobx-restful-migrator';
import { join, parse } from 'path';
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0[options]')
    .options('urls', {
        alias: 'u',
        describe: 'A list of URLs to scrape',
        type: 'array',
        demandOption: true,
    })
    .option('output', {
        alias: 'o',
        describe: 'Output file path(e.g., data.json, data.yml, data.csv)',
        type: 'string',
        default: 'data.json',
    }).argv;

const { urls, output } = argv;

console.time(output);

interface Job
    extends Record<
        'code' | 'name' | 'district' | 'department' | 'object' | 'age' | 'degree',
        string
    > {
    positions: number;
    majors: string[];
}

const HeaderMap = {
    职位代码: 'code',
    职位名称: 'name',
    地区: 'district',
    招考人数: 'positions',
    招考对象: 'object',
    年龄要求: 'age',
    学历: 'education',
    学位: 'degree',
    专业: 'majors',
    本科专业: 'majors',
} as const;

async function* dataSource(links: string[]): AsyncGenerator<Job> {
    for (const link of links) {
        const {
            window: { document },
        } = await JSDOM.fromURL(link);

        for (const { href } of document.querySelectorAll<HTMLAnchorElement>(
            '.searchList > li > a',
        )) {
            const {
                window: { document },
            } = await JSDOM.fromURL(href);

            const { firstChild } = document.querySelector('.title02');
            const department = firstChild.textContent.trim();

            const headers = Array.from(
                document.querySelectorAll('.pc_show thead th'),
                ({ textContent }) => HeaderMap[textContent.trim() as keyof typeof HeaderMap],
            );

            for (const { cells } of document.querySelectorAll<HTMLTableRowElement>(
                '.pc_show tbody tr',
            )) {
                const entries = Array.from(cells, ({ textContent }, index) => [
                    headers[index],
                    textContent.trim(),
                ]);
                const { district, name, code, positions, object, age, education, majors } =
                    Object.fromEntries(entries) as Record<(typeof headers)[number], string>;
                const majorList = majors
                    .split(/[\s\d.:：；;]+|、|，|本科|研究生|硕士|博士/)
                    .filter(Boolean);

                yield {
                    code,
                    name,
                    district,
                    department,
                    positions: +positions || 0,
                    object,
                    age,
                    degree: education,
                    majors: majorList,
                };
            }
        }
    }
}
const { dir, name, ext } = parse(output);

class TargetListModel extends YAMLListModel<Job> {
    constructor() {
        super(join(dir, name + (/\.ya?ml/.test(ext) ? ext : '.yml')));
    }
}

const crawler = new RestMigrator(dataSource, TargetListModel, {
    code: 'code',
    name: 'name',
    district: 'district',
    department: 'department',
    positions: 'positions',
    object: 'object',
    age: 'age',
    degree: 'degree',
    majors: 'majors',
});

const stringifyCSV = (data: object[]) =>
    [
        Object.keys(data[0]) + '',
        ...data.map((item) => Object.values(item).map((value) => JSON.stringify(value)) + ''),
    ].join('\n');

(async () => {
    const list = await Array.fromAsync(crawler.boot({ sourceOption: urls as string[] }));

    const data = list.uniqueBy('name');

    switch (ext) {
        case '.json':
            await outputJSON(output, data, { spaces: 4 });
            break;
        case '.yml':
        case '.yaml':
            break;
        case '.csv':
            await outputFile(output, stringifyCSV(data));
            break;
        default:
            throw new Error('Unsupported output file format: ' + ext);
    }

    console.log(data.length + '条记录，成功写入完成');
    console.timeEnd(output);
})();
