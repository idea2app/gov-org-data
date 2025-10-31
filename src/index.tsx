import { outputFile, outputJSON } from 'fs-extra';
import { JSDOM } from 'jsdom';
import { RestMigrator, YAMLListModel } from 'mobx-restful-migrator';
import { join, parse } from 'path';
import { Command } from 'commander-jsx';
import { stringifyTextTable } from 'web-utility';

Command.execute(
    <Command
        name="gov-org-data"
        description="事业单位数据爬虫"
        version="2.0.0"
        parameters="<URLs> [options]"
        options={{
            output: {
                shortcut: 'o',
                description: 'Output file path (e.g., data.json, data.yml, data.csv)',
            },
        }}
        executor={({ output = 'data.json' }, ...urls: string[]) => main(urls, output as string)}
    />,
    process.argv.slice(2),
);

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

async function main(urls: string[], output: string) {
    console.time(output);

    const { dir, name, ext } = parse(output);

    class TargetListModel extends YAMLListModel<Job> {
        constructor() {
            super(join(dir, name + (/\.ya?ml/.test(ext) ? ext : '.yml')));
        }
    }

    const crawler = new RestMigrator(dataSource, TargetListModel, {
        code: { code: { unique: true } },
        name: 'name',
        district: 'district',
        department: 'department',
        positions: 'positions',
        object: 'object',
        age: 'age',
        degree: 'degree',
        majors: 'majors',
    });
    const list = await Array.fromAsync(crawler.boot({ sourceOption: urls as string[] }));

    switch (ext) {
        case '.json':
            await outputJSON(output, list, { spaces: 4 });
            break;
        case '.yml':
        case '.yaml':
            break;
        case '.csv':
            await outputFile(output, stringifyTextTable(list));
            break;
        default:
            throw new Error('Unsupported output file format: ' + ext);
    }

    console.log(list.length + '条记录，成功写入完成');
    console.timeEnd(output);
}
